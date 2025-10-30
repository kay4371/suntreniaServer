const WebSocket = require('ws');
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv').config();
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const http = require('http');


const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map(); // userId → ws

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('🔌 WS client connected');
  const url = new URL(req.url, `http://${req.headers.host}`);
  const userId = url.searchParams.get('userId');
  if (userId) {
    clients.set(userId, ws);
    console.log(`🆔 Registered client for userId: ${userId}`);
  }
  ws.send(JSON.stringify({ message: 'Welcome!' }));
  ws.on('close', () => {
    if (userId) clients.delete(userId);
    console.log(`❌ Client disconnected${userId ? ` (${userId})` : ''}`);
  });
});

const PORT = process.env.PORT || 3000;

// Enhanced logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} ${req.method} ${req.url}`);
  console.log('📋 Query:', req.query);
  console.log('📦 Body:', req.body);
  next();
});

// Environment validation
function validateEnvironment() {
  const required = [
    'MONGODB_URI',
    'EMAIL_USER', 
    'EMAIL_PASSWORD'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    process.exit(1);
  }
}

console.log("📧 Email User:", process.env.EMAIL_USER);
console.log("📧 Password length:", process.env.EMAIL_PASSWORD?.length);
// SMTP Configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  
  // Test SMTP connection on startup
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ SMTP Connection Failed:', error);
    } else {
      console.log('✅ SMTP Server is ready to take messages');
    }
  });
  
  // IMAP Configuration
  const imapConfig = {
    imap: {
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
      host: process.env.IMAP_HOST || "imap.gmail.com",
      port: parseInt(process.env.IMAP_PORT) || 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    }
  };
  
  // Test IMAP connection function
  async function testImapConnection() {
    try {
      console.log('🔗 Testing IMAP connection...');
      const connection = await imaps.connect(imapConfig);
      console.log('✅ IMAP Connection successful');
      await connection.end();
      return true;
    } catch (error) {
      console.error('❌ IMAP Connection failed:', error.message);
      return false;
    }
  }
  
  // Database initialization
  async function initializeDatabase() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
      await client.connect();
      const db = client.db('olukayode_sage');
      
      // Create indexes for better performance
      await db.collection('user_application_response').createIndex({ userId: 1, timestamp: -1 });
      await db.collection('user_application_response').createIndex({ emailId: 1 });
      await db.collection('user_gmail_tokens').createIndex({ userId: 1 }, { unique: true });
      await db.collection('applications').createIndex({ userId: 1, jobId: 1 });
      await db.collection('jobs').createIndex({ _id: 1 });
      
      console.log('✅ Database indexes created');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
    } finally {
      await client.close();
    }
  }
  
  // Middleware
  app.use(cors());
  app.use(helmet());
  app.use(express.json());
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

  /**
 * Check if user has authorized email sending
 */
async function checkIfUserAuthorized(userId) {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
      await client.connect();
      console.log(`🔍 Checking authorization for user: ${userId}`);
      
      const db = client.db('olukayode_sage');
      const userAuth = await db.collection('user_gmail_tokens').findOne({ userId });
  
      if (!userAuth) {
        console.log(`❌ No authorization record found for user ${userId}`);
        return false;
      }
  
      if (userAuth.usePersonalEmail === false) {
        console.log(`✅ User ${userId} authorized — using company email`);
        return true;
      }
  
      if (userAuth.usePersonalEmail === true && userAuth.accessToken) {
        console.log(`✅ User ${userId} authorized — using personal Gmail`);
        return true;
      }
  
      console.log(`⚠️ Incomplete authorization details for user ${userId}`);
      return false;
    } catch (error) {
      console.error('❌ Error checking user authorization:', error);
      return false;
    } finally {
      await client.close();
    }
  }
  
  /**
   * Process application after user response
   */
  async function checkForResponses(userId, emailId, jobId, responseType) {
    console.log(`\n📧 PROCESSING APPLICATION`);
    console.log(`👤 User: ${userId}`);
    console.log(`📋 Job: ${jobId}`);
    console.log(`✅ Response: ${responseType}`);
    
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
      await client.connect();
      const db = client.db('olukayode_sage');
      
      const updateResult = await db.collection('applications').updateOne(
        { userId, jobId },
        { 
          $set: { 
            status: responseType === 'proceed' ? 'processing' : 'declined',
            processedAt: new Date(),
            emailId: emailId
          } 
        },
        { upsert: true }
      );
      
      console.log(`✅ Application status updated`);
      
      if (responseType === 'proceed') {
        const userAuth = await db.collection('user_gmail_tokens').findOne({ userId });
        
        if (userAuth?.usePersonalEmail && userAuth.accessToken) {
          console.log('📧 Will send via user\'s personal Gmail');
          await sendApplicationEmail(userId, jobId, emailId);
        } else {
          console.log('📧 Will send via company email');
          await sendApplicationEmail(userId, jobId, emailId);
        }
      }
      
      return { success: true, action: responseType };
    } catch (error) {
      console.error('❌ Error in checkForResponses:', error);
      throw error;
    } finally {
      await client.close();
    }
  }
  
  /**
   * Send application email
   */
  async function sendApplicationEmail(userId, jobId, emailId) {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
      await client.connect();
      const db = client.db('olukayode_sage');
      
      // Get job details
      const job = await db.collection('jobs').findOne({ _id: new ObjectId(jobId) });
      const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
      
      if (!job) {
        console.log('⚠️ Job details not found, using default template');
      }
      
      if (!user) {
        console.log('⚠️ User details not found');
      }
      
      const emailContent = {
        to: job?.companyEmail || 'hr@company.com',
        subject: `Application for ${job?.title || 'Position'} - ${user?.name || 'Candidate'}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #667eea; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; }
              .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Job Application</h1>
              </div>
              <div class="content">
                <p>Dear Hiring Manager,</p>
                <p>I am writing to express my interest in the <strong>${job?.title || 'available position'}</strong> at <strong>${job?.company || 'your company'}</strong>.</p>
                <p>I believe my skills and experience make me a strong candidate for this role.</p>
                <p>Please find my application materials attached and feel free to contact me to schedule an interview.</p>
                <p>Best regards,<br>${user?.name || 'Candidate'}</p>
              </div>
              <div class="footer">
                <p>Sent via IntelliJob AI Assistant</p>
              </div>
            </div>
          </body>
          </html>
        `
      };
      
      // Get user's email authorization preference
      const userAuth = await db.collection('user_gmail_tokens').findOne({ userId });
      
      let emailResult;
      if (userAuth?.usePersonalEmail && userAuth.accessToken) {
        emailResult = await sendViaGmailAPI(userAuth.accessToken, emailContent);
      } else {
        emailResult = await sendViaCompanyEmail(emailContent);
      }
      
      console.log('✅ Application email sent successfully');
      return emailResult;
    } catch (error) {
      console.error('❌ Error sending application email:', error);
      throw error;
    } finally {
      await client.close();
    }
  }
  
  /**
   * Send email via Gmail API
   */
  async function sendViaGmailAPI(accessToken, emailContent) {
    const gmail = google.gmail({ version: 'v1', auth: accessToken });
    
    const emailLines = [
      `To: ${emailContent.to}`,
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: 7bit',
      `Subject: ${emailContent.subject}`,
      '',
      emailContent.html
    ];
    
    const email = emailLines.join('\r\n').trim();
    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
    
    try {
      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail
        }
      });
      return result;
    } catch (error) {
      console.error('Gmail API error:', error);
      // Fallback to company email
      return await sendViaCompanyEmail(emailContent);
    }
  }
  
  /**
   * Send email via company SMTP
   */
  async function sendViaCompanyEmail(emailContent) {
    try {
      const result = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: emailContent.to,
        subject: emailContent.subject,
        html: emailContent.html
      });
      return result;
    } catch (error) {
      console.error('Company email error:', error);
      throw error;
    }
  }


  /**
 * Immediate response check helper
 */
async function checkForResponsesImmediately(userId, emailId, jobId) {
    const trimmedUserId = (userId || '').trim();
    const trimmedEmailId = (emailId || '').trim();
    const trimmedJobId = (jobId || '').trim();
    
    console.log(`🔍 IMMEDIATE CHECK: '${trimmedUserId}', '${trimmedEmailId}', '${trimmedJobId}'`);
  
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
      await client.connect();
      const db = client.db('olukayode_sage');
      
      const buttonResponseRecord = await db.collection('user_application_response').findOne({
        userId: trimmedUserId,
        jobId: trimmedJobId,
        emailId: trimmedEmailId
      });
  
      if (buttonResponseRecord && buttonResponseRecord.response) {
        const userResponse = buttonResponseRecord.response.toLowerCase();
        const positiveKeywords = ["proceed", "okay", "yes", "ok", "continue", "thank you", "sure", "please do"];
        const isPositive = positiveKeywords.some(keyword => userResponse.includes(keyword));
  
        if (isPositive) {
          console.log("✅ Positive response - proceeding");
          await db.collection('applications').updateOne(
            { userId: trimmedUserId, jobId: trimmedJobId },
            { $set: { status: 'approved', respondedAt: new Date() } }
          );
          return { success: true, action: 'approved' };
        } else {
          console.log("❌ Negative response - stopping");
          await db.collection('applications').updateOne(
            { userId: trimmedUserId, jobId: trimmedJobId },
            { $set: { status: 'rejected', respondedAt: new Date() } }
          );
          return { success: true, action: 'rejected' };
        }
      }
      
      return { success: true, action: 'no_response_found' };
    } catch (error) {
      console.error('❌ Error in immediate check:', error);
      throw error;
    } finally {
      await client.close();
    }
  }
  
  /**
   * Token refresh function
   */
  async function refreshAccessToken(userId) {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
      await client.connect();
      const db = client.db('olukayode_sage');
      
      const userAuth = await db.collection('user_gmail_tokens').findOne({ userId });
      if (!userAuth?.refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: userAuth.refreshToken,
          grant_type: 'refresh_token'
        })
      });
      
      const tokens = await tokenResponse.json();
      
      if (tokens.error) {
        throw new Error(`Token refresh failed: ${tokens.error}`);
      }
      
      // Update tokens in database
      await db.collection('user_gmail_tokens').updateOne(
        { userId },
        {
          $set: {
            accessToken: tokens.access_token,
            expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
            updatedAt: new Date()
          }
        }
      );
      
      return tokens.access_token;
    } finally {
      await client.close();
    }
  }


  // Success page for positive response
function getSuccessHTMLPositive() {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Success - IntelliJob</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
  
      body {
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        padding: 20px;
      }
  
      .container {
        background: white;
        padding: 50px 40px;
        border-radius: 24px;
        text-align: center;
        max-width: 480px;
        width: 100%;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.6s ease-out;
      }
  
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
  
      .checkmark {
        width: 100px;
        height: 100px;
        background: linear-gradient(135deg, #00c851 0%, #007e33 100%);
        border-radius: 50%;
        margin: 0 auto 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: scaleIn 0.5s ease;
      }
  
      @keyframes scaleIn {
        from { transform: scale(0); }
        to { transform: scale(1); }
      }
  
      .checkmark svg {
        width: 50px;
        height: 50px;
        stroke: white;
        stroke-width: 3;
        fill: none;
        animation: drawCheck 0.5s 0.3s ease forwards;
        stroke-dasharray: 100;
        stroke-dashoffset: 100;
      }
  
      @keyframes drawCheck {
        to { stroke-dashoffset: 0; }
      }
  
      h1 {
        color: #1a202c;
        font-size: 32px;
        font-weight: 800;
        margin-bottom: 15px;
      }
  
      p {
        color: #4a5568;
        font-size: 17px;
        line-height: 1.6;
        margin-bottom: 30px;
      }
  
      .btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 40px;
        border: none;
        border-radius: 12px;
        font-weight: 700;
        font-size: 15px;
        cursor: pointer;
        transition: transform 0.2s;
      }
  
      .btn:hover {
        transform: translateY(-2px);
      }
  
      .footer {
        margin-top: 30px;
        color: #718096;
        font-size: 14px;
      }
  
      .footer strong {
        background: linear-gradient(135deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="checkmark">
        <svg viewBox="0 0 52 52">
          <polyline points="14,27 22,35 38,19" />
        </svg>
      </div>
      <h1>Success!</h1>
      <p>Your application has been processed successfully and is being sent to the employer.</p>
      <button class="btn" onclick="window.close()">Close Window</button>
      <div class="footer">
        Powered by <strong>IntelliJob</strong> from Suntrenia
      </div>
    </div>
  </body>
  </html>`;
  }
  
  // Success page for negative response
  function getSuccessHTMLNegative() {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Response Received - IntelliJob</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
  
      body {
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        padding: 20px;
      }
  
      .container {
        background: white;
        padding: 50px 40px;
        border-radius: 24px;
        text-align: center;
        max-width: 480px;
        width: 100%;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.6s ease-out;
      }
  
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
  
      .icon {
        width: 100px;
        height: 100px;
        background: linear-gradient(135deg, #ff9966 0%, #ff5e62 100%);
        border-radius: 50%;
        margin: 0 auto 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: scaleIn 0.5s ease;
      }
  
      @keyframes scaleIn {
        from { transform: scale(0); }
        to { transform: scale(1); }
      }
  
      .icon-text {
        color: white;
        font-size: 40px;
        font-weight: bold;
      }
  
      h1 {
        color: #1a202c;
        font-size: 32px;
        font-weight: 800;
        margin-bottom: 15px;
      }
  
      p {
        color: #4a5568;
        font-size: 17px;
        line-height: 1.6;
        margin-bottom: 30px;
      }
  
      .btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 40px;
        border: none;
        border-radius: 12px;
        font-weight: 700;
        font-size: 15px;
        cursor: pointer;
        transition: transform 0.2s;
      }
  
      .btn:hover {
        transform: translateY(-2px);
      }
  
      .footer {
        margin-top: 30px;
        color: #718096;
        font-size: 14px;
      }
  
      .footer strong {
        background: linear-gradient(135deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="icon">
        <div class="icon-text">✓</div>
      </div>
      <h1>Response Received</h1>
      <p>We've noted your decision not to proceed with this application.</p>
      <button class="btn" onclick="window.close()">Close Window</button>
      <div class="footer">
        Powered by <strong>IntelliJob</strong> from Suntrenia
      </div>
    </div>
  </body>
  </html>`;
  }
  
  // Authorization HTML
  function getAuthorizationHTML(userId, jobId, emailId, responseId) {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Authorization - IntelliJob</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
  
    body {
      font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      background-size: 300% 300%;
      animation: gradientShift 8s ease infinite;
      margin: 0;
      padding: 20px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  
    @keyframes gradientShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
  
    .container {
      max-width: 650px;
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(30px);
      padding: 50px 40px;
      border-radius: 28px;
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.2);
      text-align: center;
      animation: slideUp 0.6s ease-out;
      position: relative;
      overflow: hidden;
    }
  
    .container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
      background-size: 200% 100%;
      animation: shimmer 3s linear infinite;
    }
  
    @keyframes shimmer {
      0% { background-position: 0% 0%; }
      100% { background-position: 200% 0%; }
    }
  
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(40px); }
      to { opacity: 1; transform: translateY(0); }
    }
  
    .icon-wrapper {
      width: 120px;
      height: 120px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      margin: 0 auto 35px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      animation: float 3s ease-in-out infinite;
      box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
    }
  
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
  
    .icon-wrapper::before {
      content: '';
      position: absolute;
      inset: -6px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 50%;
      z-index: -1;
      opacity: 0.3;
      animation: pulse 2s ease-in-out infinite;
    }
  
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.3; }
      50% { transform: scale(1.1); opacity: 0.5; }
    }
  
    .icon-wrapper svg {
      width: 60px;
      height: 60px;
      fill: white;
    }
  
    h1 {
      color: #1a202c;
      font-size: 36px;
      font-weight: 900;
      margin-bottom: 15px;
      letter-spacing: -0.5px;
    }
  
    .subtitle {
      color: #4a5568;
      font-size: 18px;
      margin-bottom: 40px;
      line-height: 1.7;
      font-weight: 500;
    }
  
    .options-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-bottom: 40px;
    }
  
    .option-card {
      background: white;
      border: 3px solid transparent;
      border-radius: 20px;
      padding: 30px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
    }
  
    .option-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
      border-color: #667eea;
    }
  
    .option-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
      transition: left 0.5s;
    }
  
    .option-card:hover::before {
      left: 100%;
    }
  
    .recommended {
      border-color: #00c851;
      background: linear-gradient(135deg, rgba(0, 200, 81, 0.05) 0%, rgba(0, 200, 81, 0.02) 100%);
    }
  
    .recommended .badge {
      position: absolute;
      top: 15px;
      right: 15px;
      background: linear-gradient(135deg, #00c851 0%, #007e33 100%);
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(0, 200, 81, 0.3);
    }
  
    .option-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 15px;
      text-align: left;
    }
  
    .option-icon {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
  
    .option-icon svg {
      width: 28px;
      height: 28px;
      fill: white;
    }
  
    .option-title {
      font-size: 22px;
      font-weight: 800;
      color: #1a202c;
      margin: 0;
    }
  
    .option-description {
      color: #4a5568;
      font-size: 15px;
      line-height: 1.6;
      text-align: left;
      margin-bottom: 20px;
    }
  
    .benefits {
      display: flex;
      flex-direction: column;
      gap: 10px;
      text-align: left;
    }
  
    .benefit-item {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #2d3748;
      font-size: 14px;
    }
  
    .benefit-item svg {
      width: 18px;
      height: 18px;
      fill: #00c851;
      flex-shrink: 0;
    }
  
    .security-note {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
      border-left: 4px solid #667eea;
      padding: 20px;
      border-radius: 12px;
      text-align: left;
      margin-top: 30px;
    }
  
    .security-note h3 {
      color: #1a202c;
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  
    .security-note h3 svg {
      width: 20px;
      height: 20px;
      fill: #667eea;
    }
  
    .security-note ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
  
    .security-note li {
      color: #4a5568;
      font-size: 14px;
      line-height: 1.8;
      padding-left: 24px;
      position: relative;
    }
  
    .security-note li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
    }
  
    .footer {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid rgba(0, 0, 0, 0.06);
      color: #718096;
      font-size: 14px;
    }
  
    .footer strong {
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: 800;
    }
  
    @media (max-width: 768px) {
      .container {
        padding: 40px 25px;
      }
  
      h1 {
        font-size: 28px;
      }
  
      .subtitle {
        font-size: 16px;
      }
  
      .option-card {
        padding: 25px;
      }
  
      .option-title {
        font-size: 19px;
      }
    }
  
    .loading {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(5px);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    }
  
    .loading.active {
      display: flex;
    }
  
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
  </head>
  <body>
  <div class="loading" id="loading">
    <div class="spinner"></div>
  </div>
  
  <div class="container">
    <div class="icon-wrapper">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
      </svg>
    </div>
  
    <h1>Choose Email Method</h1>
    <p class="subtitle">Select how you'd like us to send your job applications</p>
  
    <div class="options-container">
      <!-- Option 1: Personal Gmail -->
      <div class="option-card recommended" onclick="authorizeGmail()">
        <span class="badge">Recommended</span>
        <div class="option-header">
          <div class="option-icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
          </div>
          <h3 class="option-title">Use My Gmail Account</h3>
        </div>
        <p class="option-description">
          Applications will be sent from your personal Gmail address, giving them a professional, personal touch.
        </p>
        <div class="benefits">
          <div class="benefit-item">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <span>Higher response rates from employers</span>
          </div>
          <div class="benefit-item">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <span>Applications appear more authentic</span>
          </div>
          <div class="benefit-item">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <span>You maintain full control</span>
          </div>
        </div>
      </div>
  
      <!-- Option 2: Company Email -->
      <div class="option-card" onclick="useCompanyEmail()">
        <div class="option-header">
          <div class="option-icon" style="background: linear-gradient(135deg, #ff9966 0%, #ff5e62 100%);">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            </svg>
          </div>
          <h3 class="option-title">Use IntelliJob Email</h3>
        </div>
        <p class="option-description">
          Applications will be sent from our official email address. This option works but is not recommended.
        </p>
        <div class="benefits">
          <div class="benefit-item">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <span>No authorization required</span>
          </div>
          <div class="benefit-item">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <span>Quick setup process</span>
          </div>
          <div class="benefit-item" style="color: #e53e3e;">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="fill: #e53e3e;">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>May have lower response rates</span>
          </div>
        </div>
      </div>
    </div>
  
    <div class="security-note">
      <h3>
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
        </svg>
        Your Security is Our Priority
      </h3>
      <ul>
        <li>We only request permission to send emails on your behalf</li>
        <li>We cannot read, access, or delete your existing emails</li>
        <li>You can revoke access anytime from your Google Account settings</li>
        <li>All data is encrypted and securely stored</li>
        <li>We comply with Google's OAuth 2.0 security standards</li>
      </ul>
    </div>
  
    <div class="footer">
      Powered by <strong>IntelliJob</strong> from Suntrenia
    </div>
  </div>
  
  <script>
    const userId = '${userId}';
    const jobId = '${jobId}';
    const emailId = '${emailId}';
    const responseId = '${responseId}';
  
    function authorizeGmail() {
      document.getElementById('loading').classList.add('active');
      const params = new URLSearchParams({ userId, jobId, emailId, responseId });
      window.location.href = '/auth/google?' + params.toString();
    }
  
    function useCompanyEmail() {
      if (confirm('Are you sure you want to use our company email? Using your personal Gmail is recommended for better response rates.')) {
        document.getElementById('loading').classList.add('active');
        const params = new URLSearchParams({ userId, jobId, emailId, responseId });
        window.location.href = '/auth/use-company-email?' + params.toString();
      }
    }
  </script>
  </body>
  </html>`;
  }
  
  // Authorization success HTML
  function getSuccessHTML() {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Authorization Complete - IntelliJob</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
  
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      background-size: 300% 300%;
      animation: gradientShift 6s ease infinite;
      margin: 0;
      padding: 20px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  
    @keyframes gradientShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
  
    .container {
      max-width: 500px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      padding: 40px;
      border-radius: 24px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
      text-align: center;
      animation: containerFloat 0.8s ease-out;
    }
  
    @keyframes containerFloat {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
  
    .checkmark {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, #00c851 0%, #007e33 100%);
      border-radius: 50%;
      margin: 0 auto 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: scaleIn 0.5s ease;
    }
  
    @keyframes scaleIn {
      from { transform: scale(0); }
      to { transform: scale(1); }
    }
  
    .checkmark svg {
      width: 50px;
      height: 50px;
      stroke: white;
      stroke-width: 3;
      fill: none;
      animation: drawCheck 0.5s 0.3s ease forwards;
      stroke-dasharray: 100;
      stroke-dashoffset: 100;
    }
  
    @keyframes drawCheck {
      to { stroke-dashoffset: 0; }
    }
  
    h1 {
      color: #1a202c;
      font-size: 32px;
      font-weight: 800;
      margin-bottom: 15px;
    }
  
    p {
      color: #4a5568;
      font-size: 17px;
      line-height: 1.6;
      margin-bottom: 30px;
    }
  
    .btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 40px;
      border: none;
      border-radius: 12px;
      font-weight: 700;
      font-size: 15px;
      cursor: pointer;
      transition: transform 0.2s;
    }
  
    .btn:hover {
      transform: translateY(-2px);
    }
  
    .footer {
      margin-top: 30px;
      color: #718096;
      font-size: 14px;
    }
  
    .footer strong {
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  </style>
  </head>
  <body>
  <div class="container">
    <div class="checkmark">
      <svg viewBox="0 0 52 52">
        <polyline points="14,27 22,35 38,19" />
      </svg>
    </div>
    <h1>All Set!</h1>
    <p>Your authorization is complete. We'll now proceed with your application.</p>
    <button class="btn" onclick="window.close()">Close Window</button>
    <div class="footer">
      Powered by <strong>IntelliJob</strong> from Suntrenia
    </div>
  </div>
  </body>
  </html>`;
  }


  // Test route with environment info
app.get('/', (req, res) => {
    const envInfo = {
      email_user: process.env.EMAIL_USER ? 'Set' : 'Missing',
      mongodb_uri: process.env.MONGODB_URI ? 'Set' : 'Missing',
      node_env: process.env.NODE_ENV || 'development',
      google_client_id: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
      google_redirect_uri: process.env.GOOGLE_REDIRECT_URI ? 'Set' : 'Missing'
    };
  
    res.json({
      message: '🟢 Backend is running',
      environment: envInfo,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });
  
  // Health check endpoint
  app.get('/health', async (req, res) => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {}
    };
    
    // Check MongoDB
    try {
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      await client.db().admin().ping();
      await client.close();
      health.checks.mongodb = 'ok';
    } catch (error) {
      health.checks.mongodb = 'error';
      health.status = 'degraded';
    }
    
    // Check SMTP
    try {
      await transporter.verify();
      health.checks.smtp = 'ok';
    } catch (error) {
      health.checks.smtp = 'error';
      health.status = 'degraded';
    }
    
    res.json(health);
  });
  
  // Get all user responses
  app.get('/api/user-responses', async (req, res) => {
    const { userId } = req.query;
  
    console.log('📋 GET USER-RESPONSES CALLED:');
    console.log('📋 Query parameters:', req.query);
    console.log('📋 UserId received:', userId);
  
    if (!userId) {
      console.log('❌ Missing userId parameter');
      return res.status(400).json({ error: 'userId is required' });
    }
  
    let mongoClient;
  
    try {
      console.log('🗄️ Connecting to MongoDB...');
      mongoClient = new MongoClient(process.env.MONGODB_URI);
      await mongoClient.connect();
      console.log('✅ Connected to MongoDB');
  
      const db = mongoClient.db('olukayode_sage');
      const collection = db.collection('user_application_response');
  
      // Get all responses for this user, sorted by timestamp (newest first)
      console.log(`🔍 Retrieving responses for user: ${userId}`);
      const userResponses = await collection.find({ userId }).sort({ timestamp: -1 }).toArray();
  
      console.log(`✅ Found ${userResponses.length} responses for user ${userId}`);
      console.log('📊 Responses found:', userResponses.map(r => ({
        id: r._id,
        response: r.response,
        jobId: r.jobId,
        timestamp: r.timestamp
      })));
      
      await mongoClient.close();
  
      res.json({
        success: true,
        count: userResponses.length,
        responses: userResponses,
        timestamp: new Date().toISOString()
      });
  
    } catch (error) {
      console.error('❌ ERROR retrieving user responses:', error);
      console.error('❌ Error stack:', error.stack);
      
      if (mongoClient) {
        await mongoClient.close().catch(e => console.error('Error closing MongoDB:', e));
      }
  
      res.status(500).json({ 
        error: 'Failed to retrieve user responses',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Main response handler
  app.get('/handle-response', async (req, res) => {
    const { 
      response, 
      emailId, 
      jobId, 
      userId, 
      emailSubject = 'Not provided', 
      companyName = 'Unknown Company', 
      jobTitle = 'Unknown Position',
      applicationStatus = 'pending',
      emailDate = new Date().toISOString(),
      emailFrom = 'Unknown Sender'
    } = req.query;
  
    const trimmedUserId = (userId || '').trim();
    const trimmedResponse = (response || '').trim();
    const trimmedEmailId = (emailId || '').trim();
    const trimmedJobId = (jobId || '').trim();
    const trimmedEmailSubject = (emailSubject || '').trim();
    const trimmedCompanyName = (companyName || '').trim();
    const trimmedJobTitle = (jobTitle || '').trim();
  
    console.log('\n🎯 HANDLE-RESPONSE CALLED:');
    console.log('📩 Received parameters:', { 
      response: `${response}`, 
      emailId: `${emailId}`, 
      jobId: `${jobId}`, 
      userId: `${userId}`,
      emailSubject: `${emailSubject}`,
      companyName: `${companyName}`,
      jobTitle: `${jobTitle}`
    });
    console.log('📩 Trimmed parameters:', { 
      response: `${trimmedResponse}`, 
      emailId: `${trimmedEmailId}`, 
      jobId: `${trimmedJobId}`, 
      userId: `${trimmedUserId}`,
      emailSubject: `${trimmedEmailSubject}`,
      companyName: `${trimmedCompanyName}`,
      jobTitle: `${trimmedJobTitle}`
    });
  
    // Validate required parameters
    if (!trimmedResponse || !trimmedEmailId || !trimmedJobId || !trimmedUserId) {
      console.log('❌ Missing required parameters after trimming');
      return res.status(400).send('Missing required parameters');
    }
  
    let mongoClient;
  
    try {
      console.log('🗄️ Connecting to MongoDB...');
      mongoClient = new MongoClient(process.env.MONGODB_URI);
      await mongoClient.connect();
      console.log('✅ Connected to MongoDB');
  
      const db = mongoClient.db('olukayode_sage');
  
      // Store the response with ALL parameters and default values
      console.log('💾 Storing response in database with all parameters...');
      const responseData = {
        userId: trimmedUserId,
        response: trimmedResponse,
        emailId: trimmedEmailId,
        jobId: trimmedJobId,
        emailSubject: trimmedEmailSubject,
        companyName: trimmedCompanyName,
        jobTitle: trimmedJobTitle,
        applicationStatus: applicationStatus,
        emailDate: emailDate,
        emailFrom: emailFrom,
        timestamp: new Date(),
        processed: false
      };
  
      const insertResult = await db.collection('user_application_response').insertOne(responseData);
  
      console.log('✅ Response stored in DB with ID:', insertResult.insertedId);
      console.log('📊 Stored data:', responseData);
  
      // Immediate response check
      console.log('🚀 Triggering immediate response check...');
      const checkResult = await checkForResponsesImmediately(trimmedUserId, trimmedEmailId, trimmedJobId);
      console.log('✅ Immediate check completed:', checkResult);
  
      // Update the record as processed
      await db.collection('user_application_response').updateOne(
        { _id: insertResult.insertedId },
        { $set: { processed: true, processedAt: new Date() } }
      );
      console.log('✅ Response marked as processed');
  
      // 🔥 WEB SOCKET NOTIFICATION: Notify frontend that data is ready
      const payload = {
        type: trimmedResponse.toLowerCase(),
        userId: trimmedUserId,
        jobId: trimmedJobId,
        emailId: trimmedEmailId,
        responseId: insertResult.insertedId,
        message: `User selected "${trimmedResponse}" for the application`,
        timestamp: new Date().toISOString()
      };
  
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(payload));
        }
      });
      console.log('📢 WebSocket notification sent to all connected clients');
  
      // Determine if response is positive or negative
      const positiveKeywords = ["proceed", "okay", "yes", "ok", "continue", "thank you", "sure", "please do"];
      const isPositive = positiveKeywords.some(keyword => trimmedResponse.toLowerCase().includes(keyword));
      
      console.log('📤 Sending HTML response to client');
      
      if (isPositive) {
        // 🔥 CHECK AUTHORIZATION
        console.log('🔐 Checking user authorization...');
        const authorized = await checkIfUserAuthorized(trimmedUserId);
        
        // ✅ NOW close MongoDB
        await mongoClient.close();
        console.log('✅ MongoDB connection closed');
        
        if (!authorized) {
          console.log(`🔐 User ${trimmedUserId} not authorized - showing authorization page`);
          res.send(getAuthorizationHTML(trimmedUserId, trimmedJobId, trimmedEmailId, insertResult.insertedId));
        } else {
          console.log(`✅ User ${trimmedUserId} already authorized - processing application`);
          await checkForResponses(trimmedUserId, trimmedEmailId, trimmedJobId, 'proceed');
          res.send(getSuccessHTMLPositive());
        }
      } else {
        // ✅ Close MongoDB for negative response
        await mongoClient.close();
        console.log('✅ MongoDB connection closed');
        
        // Send negative response HTML
        res.send(getSuccessHTMLNegative());
      }
      
    } catch (err) {
      console.error('❌ ERROR in handle-response:', err);
      console.error('Stack trace:', err.stack);
      
      if (mongoClient) {
        await mongoClient.close().catch(e => console.error('Error closing MongoDB:', e));
      }
      
      res.status(500).send(
        `<html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>Server Error</h1>
            <p>Please try again later. If the problem persists, contact support.</p>
            <p><small>Error: ${err.message}</small></p>
          </body>
        </html>`
      );
    }
  });
  
  // Route to initiate Google OAuth
  app.get('/auth/google', (req, res) => {
    const { userId, jobId, emailId, responseId } = req.query;
    
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REDIRECT_URI) {
      return res.status(500).send('Google OAuth not configured');
    }
    
    // Store these in session or pass as state parameter
    const state = Buffer.from(JSON.stringify({ userId, jobId, emailId, responseId })).toString('base64');
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('https://www.googleapis.com/auth/gmail.send')}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${state}`;
    
    console.log(`🔐 Initiating Google OAuth for user: ${userId}`);
    res.redirect(googleAuthUrl);
  });
  
  // OAuth callback route
  app.get('/auth/google/callback', async (req, res) => {
    const { code, state } = req.query;
    
    if (!code) {
      console.error('❌ OAuth callback missing code');
      return res.status(400).send('Authorization failed - no code received');
    }
    
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
      console.error('❌ OAuth configuration missing');
      return res.status(500).send('OAuth configuration incomplete');
    }
    
    try {
      // Decode state to get user info
      const { userId, jobId, emailId, responseId } = JSON.parse(Buffer.from(state, 'base64').toString());
      console.log(`🔄 Processing OAuth callback for user: ${userId}`);
      
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: process.env.GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code'
        })
      });
      
      const tokens = await tokenResponse.json();
      
      if (tokens.error) {
        console.error('❌ Token exchange failed:', tokens.error);
        throw new Error(`Token exchange failed: ${tokens.error_description || tokens.error}`);
      }
      
      // Store tokens in database
      const mongoClient = new MongoClient(process.env.MONGODB_URI);
      await mongoClient.connect();
      const db = mongoClient.db('olukayode_sage');
      
      await db.collection('user_gmail_tokens').updateOne(
        { userId },
        { 
          $set: { 
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
            updatedAt: new Date(),
            usePersonalEmail: true
          } 
        },
        { upsert: true }
      );
      
      await mongoClient.close();
      
      // 🔥 NEW: Now that user is authorized, automatically process the application
      console.log(`✅ User ${userId} authorized - triggering application process`);
      await checkForResponses(userId, emailId, jobId, 'proceed');
      
      // 🔥 NEW: Notify frontend via WebSocket that authorization is complete
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "authorization_complete",
            userId,
            jobId,
            emailId,
            message: "Authorization successful - application processing"
          }));
        }
      });
      
      console.log(`✅ OAuth flow completed successfully for user: ${userId}`);
      res.send(getSuccessHTML());
      
    } catch (error) {
      console.error('❌ OAuth error:', error);
      res.status(500).send(
        `<html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>Authorization Failed</h1>
            <p>Please try again later.</p>
            <p><small>Error: ${error.message}</small></p>
          </body>
        </html>`
      );
    }
  });
  
  // Route for using company email
  app.get('/auth/use-company-email', async (req, res) => {
    const { userId, jobId, emailId, responseId } = req.query;
    
    console.log(`🏢 User ${userId} selected company email option`);
    
    try {
      const mongoClient = new MongoClient(process.env.MONGODB_URI);
      await mongoClient.connect();
      const db = mongoClient.db('olukayode_sage');
      
      await db.collection('user_gmail_tokens').updateOne(
        { userId },
        { 
          $set: { 
            usePersonalEmail: false,
            updatedAt: new Date()
          } 
        },
        { upsert: true }
      );
      
      await mongoClient.close();
      
      // 🔥 NEW: Now that user chose company email, automatically process the application
      console.log(`✅ User ${userId} chose company email - triggering application process`);
      await checkForResponses(userId, emailId, jobId, 'proceed');
      
      // 🔥 NEW: Notify frontend via WebSocket
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "authorization_complete",
            userId,
            jobId,
            emailId,
            message: "Company email selected - application processing"
          }));
        }
      });
      
      res.send(getSuccessHTML());
      
    } catch (error) {
      console.error('❌ Error setting company email:', error);
      res.status(500).send(
        `<html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>Error</h1>
            <p>An error occurred. Please try again.</p>
            <p><small>Error: ${error.message}</small></p>
          </body>
        </html>`
      );
    }
  });
  
  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Route not found',
      path: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  });
  
  // Global error handler
  app.use((error, req, res, next) => {
    console.error('🚨 Global error handler:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  });
  
  // Server startup with comprehensive logging
  server.listen(PORT, async () => {
    console.log(`\n🚀 Server starting...`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`📧 Email User: ${process.env.EMAIL_USER}`);
    console.log(`🗄️ MongoDB: ${process.env.MONGODB_URI ? 'Configured' : 'Missing'}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Validate environment first
    validateEnvironment();
    
    // Initialize database
    await initializeDatabase();
    
    // Test connections on startup
    console.log('\n🔗 Testing connections...');
    await testImapConnection();
  
    console.log(`\n✅ Server running on http://localhost:${PORT}`);
    console.log('📊 Available endpoints:');
    console.log('   GET  /                    - Health check');
    console.log('   GET  /health              - Detailed health status');
    console.log('   GET  /api/user-responses  - Get user responses');
    console.log('   GET  /handle-response     - Process user responses');
    console.log('   GET  /auth/google         - Start OAuth flow');
    console.log('   GET  /auth/google/callback - OAuth callback');
    console.log('   GET  /auth/use-company-email - Use company email');
    console.log('\n🔧 Logs available in Render Dashboard → Your Service → Logs');
  });
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('🔄 Received SIGTERM, shutting down gracefully...');
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  });
  
  process.on('SIGINT', async () => {
    console.log('🔄 Received SIGINT, shutting down gracefully...');
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  });
  
  module.exports = app;
