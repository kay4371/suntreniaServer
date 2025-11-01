
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

wss.on('connection', (ws, req) => {
  console.log('🔌 WS client connected');

  // Optionally get userId from query (?userId=123)
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

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Test route with environment info
app.get('/', (req, res) => {
  const envInfo = {
    email_user: process.env.EMAIL_USER ? 'Set' : 'Missing',
    mongodb_uri: process.env.MONGODB_URI ? 'Set' : 'Missing',
    node_env: process.env.NODE_ENV || 'development'
  };

  res.json({
    message: '🟢 Backend is running',
    environment: envInfo,
    timestamp: new Date().toISOString()
  });
});

// NEW ENDPOINT: Get all user responses
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

// Enhanced checkForResponses with detailed logging
app.get('/check-responses', async (req, res) => {
  const { userId, emailId, jobId } = req.query;

  console.log('🔍 CHECK-RESPONSES STARTED:', { userId, emailId, jobId });

  if (!userId) {
    console.log('❌ Missing userId parameter');
    return res.status(400).json({ error: 'userId is required' });
  }

  let connection;
  let mongoClient;

  try {
    console.log(`🔄 Starting response check for user: ${userId}`);

    // Test IMAP connection first
    const imapConnected = await testImapConnection();
    if (!imapConnected) {
      throw new Error('IMAP connection failed');
    }

    // Connect to IMAP server
    console.log('📧 Connecting to IMAP server...');
    connection = await imaps.connect(imapConfig);
    await connection.openBox('INBOX');
    console.log('✅ Connected to IMAP inbox');

    // Search for unread emails
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };

    console.log('🔎 Searching for unread emails...');
    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`📨 Found ${messages.length} unread messages`);

    if (messages.length === 0) {
      console.log('ℹ️ No new responses found.');
      await connection.end();
      return res.json({ 
        success: true, 
        responsesFound: 0, 
        message: 'No new responses',
        timestamp: new Date().toISOString()
      });
    }

    // Connect to MongoDB
    console.log('🗄️ Connecting to MongoDB...');
    mongoClient = new MongoClient(process.env.MONGODB_URI);
    await mongoClient.connect();
    console.log('✅ Connected to MongoDB');

    const db = mongoClient.db('olukayode_sage');
    const collection = db.collection('user_application_response');

    let processedCount = 0;
    let positiveResponses = 0;
    let negativeResponses = 0;

    console.log(`📊 Processing ${messages.length} messages...`);

    // Process each email
    for (const [index, message] of messages.entries()) {
      console.log(`\n📧 Processing message ${index + 1}/${messages.length}`);

      const textPart = message.parts.find(part => part.which === 'TEXT');
      const id = message.attributes.uid;
      const rawMessage = textPart?.body;

      if (!rawMessage) {
        console.log('⚠️ No message body found for this email.');
        continue;
      }

      // Parse the email
      try {
        const parsedEmail = await simpleParser(rawMessage);
        const from = parsedEmail.from?.text || 'Unknown sender';
        const subject = parsedEmail.subject || 'No subject';

        console.log(`👤 From: ${from}`);
        console.log(`📝 Subject: ${subject}`);

        // Extract email content for analysis
        const emailContent = (parsedEmail.text || '').toLowerCase();
        console.log(`📄 Email content preview: ${emailContent.substring(0, 100)}...`);

        // Check if this is a response to one of our applications
        const applicationMatch = await db.collection('applications').findOne({
          userId: userId,
          $or: [
            { employerEmail: { $regex: from, $options: 'i' } },
            { 'emailData.to': { $regex: from, $options: 'i' } }
          ]
        });

        if (applicationMatch) {
          console.log(`🎯 Found matching application for job: ${applicationMatch.jobTitle}`);
          
          // Analyze email content for positive/negative response
          const positiveKeywords = ["congratulation", "interview", "next step", "selected", "welcome", "offer", "opportunity", "interested"];
          const negativeKeywords = ["unfortunately", "not selected", "reject", "decline", "not move forward", "other candidate"];
          
          const isPositive = positiveKeywords.some(keyword => emailContent.includes(keyword));
          const isNegative = negativeKeywords.some(keyword => emailContent.includes(keyword));
          
          let responseType = 'unknown';
          if (isPositive) {
            responseType = 'positive';
            positiveResponses++;
          } else if (isNegative) {
            responseType = 'negative';
            negativeResponses++;
          }
          
          console.log(`📊 Response type: ${responseType}`);
          
          // Store the response in database
          const responseData = {
            userId: userId,
            applicationId: applicationMatch._id.toString(),
            jobId: applicationMatch.jobId,
            employer: from,
            subject: subject,
            content: emailContent,
            responseType: responseType,
            receivedAt: new Date(),
            processed: true
          };
          
          await collection.insertOne(responseData);
          console.log(`💾 Response stored in database with type: ${responseType}`);
          
          // Send real-time update via WebSocket if client is connected
          const wsClient = clients.get(userId);
          if (wsClient && wsClient.readyState === 1) {
            wsClient.send(JSON.stringify({
              type: 'email_response',
              data: {
                applicationId: applicationMatch._id.toString(),
                jobId: applicationMatch.jobId,
                jobTitle: applicationMatch.jobTitle,
                employer: from,
                subject: subject,
                responseType: responseType,
                timestamp: new Date().toISOString()
              }
            }));
            console.log(`📡 WebSocket update sent for user: ${userId}`);
          }
          
          // Update application status based on response
          let newStatus = applicationMatch.status;
          if (isPositive) {
            newStatus = 'response_received';
            // If it's clearly a positive response, update accordingly
            if (emailContent.includes('interview') || emailContent.includes('next step')) {
              newStatus = 'interview_stage';
            }
          } else if (isNegative) {
            newStatus = 'rejected';
          }
          
          if (newStatus !== applicationMatch.status) {
            await db.collection('applications').updateOne(
              { _id: applicationMatch._id },
              { $set: { status: newStatus, lastUpdated: new Date() } }
            );
            console.log(`🔄 Application status updated to: ${newStatus}`);
          }
        } else {
          console.log('ℹ️ Email does not match any known applications');
        }

      } catch (parseError) {
        console.error('❌ Error parsing email:', parseError);
        continue;
      }

      processedCount++;
    }

    await connection.end();
    await mongoClient.close();

    console.log(`✅ Processed ${processedCount} responses successfully`);
    res.json({ 
      success: true, 
      responsesFound: messages.length, 
      processed: processedCount,
      positiveResponses,
      negativeResponses,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ ERROR in checkForResponses:', error);
    console.error('Stack trace:', error.stack);

    if (connection) {
      await connection.end().catch(e => console.error('Error closing IMAP:', e));
    }
    if (mongoClient) {
      await mongoClient.close().catch(e => console.error('Error closing MongoDB:', e));
    }

    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced handle-response with userId trimming fix
app.get('/handle-response', async (req, res) => {
  // Extract all parameters with default values and trim whitespace
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

  // Trim all string parameters to remove whitespace
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
      type: trimmedResponse.toLowerCase(),   // 👈 dynamically set as 'proceed' or 'declined'
      userId: trimmedUserId,
      jobId: trimmedJobId,
      emailId: trimmedEmailId,
      responseId: insertResult.insertedId,
      message: `User selected "${trimmedResponse}" for the application`,
      timestamp: new Date().toISOString()
    };

    wss.clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify(payload));
      }
    });
    console.log('📢 WebSocket notification sent to all connected clients');

    await mongoClient.close();
    console.log('✅ MongoDB connection closed');

    // Send success response
    console.log('📤 Sending HTML response to client');
    
    // REPLACE THE HTML CONTENT HERE
    res.send(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Success</title>
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
          margin: 50px auto;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: containerFloat 0.8s ease-out;
        }
      
        @keyframes containerFloat {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      
        .circle {
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, #00c851 0%, #007e33 100%);
          border-radius: 50%;
          margin: 0 auto 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 15px 35px rgba(0, 200, 81, 0.3);
          position: relative;
          animation: bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.2s both;
        }
      
        .circle::before {
          content: '';
          position: absolute;
          inset: -4px;
          background: linear-gradient(135deg, #00c851, #007e33);
          border-radius: 50%;
          z-index: -1;
          opacity: 0.4;
          animation: ripple 2.5s ease-in-out 1s infinite;
        }
      
        @keyframes bounceIn {
          from { transform: scale(0) rotate(180deg); }
          to { transform: scale(1) rotate(0deg); }
        }
      
        @keyframes ripple {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.15); opacity: 0.7; }
        }
      
        .tick {
          color: white;
          font-size: 38px;
          font-weight: bold;
          opacity: 0;
          animation: tickReveal 0.6s ease 1s both;
        }
      
        @keyframes tickReveal {
          from { opacity: 0; transform: scale(0.5) rotate(-45deg); }
          to { opacity: 1; transform: scale(1) rotate(0deg); }
        }
      
        h1 {
          color: #1a202c;
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 15px;
          animation: slideUp 0.6s ease 0.4s both;
        }
      
        p {
          color: #4a5568;
          font-size: 17px;
          margin-bottom: 20px;
          line-height: 1.6;
          animation: slideUp 0.6s ease 0.6s both;
        }
      
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      
        .button-row {
          display: flex;
          gap: 20px;
          margin: 35px 0;
          animation: slideUp 0.6s ease 0.8s both;
        }
      
        .btn {
          flex: 1;
          padding: 16px 20px;
          border: none;
          border-radius: 16px;
          cursor: pointer;
          font-weight: 700;
          font-size: 15px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      
        .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          transition: left 0.5s;
        }
      
        .btn:hover::before {
          left: 100%;
        }
      
        .btn:active {
          transform: scale(0.98);
        }
      
        .btn-green {
          background: linear-gradient(135deg, #00c851 0%, #007e33 100%);
          color: white;
          box-shadow: 0 8px 20px rgba(0, 200, 81, 0.35);
          position: relative;
        }
      
        .btn-green::after {
          content: "Enable for future applications";
          position: absolute;
          bottom: -35px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 11px;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
          font-weight: 500;
          text-transform: none;
          letter-spacing: 0;
        }
      
        .btn-green:hover::after {
          opacity: 1;
        }
      
        .btn-green:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 25px rgba(0, 200, 81, 0.45);
        }
      
        .btn-purple {
          background: linear-gradient(135deg, #6c5ce7 0%, #5a4fcf 100%);
          color: white;
          box-shadow: 0 8px 20px rgba(108, 92, 231, 0.35);
        }
      
        .btn-purple:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 25px rgba(108, 92, 231, 0.45);
        }
      
        .footer {
          margin-top: 35px;
          color: #718096;
          font-size: 14px;
          animation: slideUp 0.6s ease 1s both;
        }
      
        .footer strong {
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      
        @media (max-width: 480px) {
          .container {
            margin: 20px;
            padding: 32px 24px;
          }
          
          .button-row {
            flex-direction: column;
            gap: 16px;
          }
          
          .btn-green::after {
            bottom: -30px;
            font-size: 10px;
          }
          
          h1 {
            font-size: 26px;
          }
        }
      
        .exit-message {
          display: none;
          text-align: center;
          padding: 60px 40px;
          font-family: sans-serif;
          color: white;
          animation: fadeIn 0.5s ease;
        }
      
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      
        .exit-message h2 {
          font-size: 28px;
          margin-bottom: 15px;
          text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
      
        .exit-message p {
          font-size: 18px;
          opacity: 0.9;
        }
      </style>
      </head>
      <body>
      <div class="container">
        <div class="circle">
          <div class="tick">✓</div>
        </div>
        <h1>Excellent Choice!</h1>
        <p>We've received your response and will now proceed with your application.</p>
        <div class="button-row">
          <button class="btn btn-green" onclick="window.location.href='/dashboard/settings'">
            Auto-Apply
          </button>
          <button class="btn btn-purple" onclick="exitPage()">
            Exit
          </button>
        </div>
        <div class="footer">
          Powered by <strong>IntelliJob</strong> from Suntrenia
        </div>
      </div>
      
      <div class="exit-message">
        <h2>You can safely close this tab now</h2>
        <p>Thank you for using IntelliJob!</p>
      </div>
      
      <script>
        console.log('Response processed successfully');
        
        function exitPage() {
          document.querySelector('.container').style.display = 'none';
          document.querySelector('.exit-message').style.display = 'block';
          
          setTimeout(() => {
            try {
              window.close();
            } catch (e) {
              console.log('Cannot close window');
            }
            
            setTimeout(() => {
              try {
                if (window.history.length > 1) {
                  window.history.back();
                }
              } catch (e) {
                console.log('Cannot go back');
              }
            }, 500);
          }, 1000);
        }
        
        document.querySelectorAll('.btn').forEach(btn => {
          btn.addEventListener('click', function() {
            this.style.transform = 'scale(0.98) translateY(-3px)';
            setTimeout(() => {
              this.style.transform = '';
            }, 150);
          });
        });
      </script>
      </body>
      </html>`
    );

    
  } catch (err) {
    console.error('❌ ERROR in handle-response:', err);
    console.error('Stack trace:', err.stack);
    
    if (mongoClient) {
      await mongoClient.close().catch(e => console.error('Error closing MongoDB:', e));
    }
    
    res.status(500).send(
      `<html>
        <body>
          <h1>Server Error</h1>
          <p>Please try again later. If the problem persists, contact support.</p>
          <p><small>Error: ${err.message}</small></p>
        </body>
      </html>`
    );
  }
});

// Enhanced helper function
async function checkForResponsesImmediately(userId, emailId, jobId) {
  // Trim parameters to ensure consistency
  const trimmedUserId = (userId || '').trim();
  const trimmedEmailId = (emailId || '').trim();
  const trimmedJobId = (jobId || '').trim();
  
  console.log(`🔍 IMMEDIATE CHECK: '${trimmedUserId}', '${trimmedEmailId}', '${trimmedJobId}'`);

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const db = client.db('olukayode_sage');
    const collection = db.collection('user_application_response');

    console.log('🔎 Looking for button response in DB...');
    const buttonResponseRecord = await collection.findOne({
      userId: trimmedUserId,
      jobId: trimmedJobId,
      emailId: trimmedEmailId
    });

    if (buttonResponseRecord && buttonResponseRecord.response) {
      console.log("✅ Button response found:", buttonResponseRecord.response);
      const userResponse = buttonResponseRecord.response.toLowerCase();

      const positiveKeywords = ["proceed", "okay", "yes", "ok", "continue", "thank you", "sure", "please do"];
      const isPositive = positiveKeywords.some(keyword => userResponse.includes(keyword));

      if (isPositive) {
        console.log("✅ Positive response detected - proceeding with application");
        await db.collection('applications').updateOne(
          { userId: trimmedUserId, jobId: trimmedJobId },
          { $set: { status: 'approved', respondedAt: new Date() } }
        );
        return { success: true, action: 'approved' };
      } else {
        console.log("❌ Negative response detected - stopping application");
        await db.collection('applications').updateOne(
          { userId: trimmedUserId, jobId: trimmedJobId },
          { $set: { status: 'rejected', respondedAt: new Date() } }
        );
        return { success: true, action: 'rejected' };
      }
    } else {
      console.log("ℹ️ No button response found in DB");
      return { success: true, action: 'no_response_found' };
    }

  } catch (error) {
    console.error('❌ Error in immediate check:', error);
    throw error;
  }
}

// Server startup with comprehensive logging
server.listen(PORT, async () => {
  console.log(`\n🚀 Server starting...`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`📧 Email User: ${process.env.EMAIL_USER}`);
  console.log(`🗄️ MongoDB: ${process.env.MONGODB_URI ? 'Configured' : 'Missing'}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Test connections on startup
  console.log('\n🔗 Testing connections...');
  await testImapConnection();

  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log('📊 Logs available in Render Dashboard → Your Service → Logs');
});
