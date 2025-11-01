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

// ADD THIS RIGHT HERE - BEFORE ANY OTHER MIDDLEWARE
// Middleware
app.use(cors());

// Remove CSP headers
app.use((req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('X-Content-Security-Policy');
  res.removeHeader('X-WebKit-CSP');
  next();
});

app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));


function broadcastToClients(payload) {
  console.log('📢 Broadcasting WebSocket message:', payload);
  console.log(`📊 Total clients to broadcast to: ${wss.clients.size}`);
  
  let sentCount = 0;
  
  wss.clients.forEach((client, index) => {
    console.log(`🔍 Client ${index + 1}:`, {
      readyState: client.readyState,
      WebSocket: {
        OPEN: WebSocket.OPEN,
        CONNECTING: WebSocket.CONNECTING,
        CLOSING: WebSocket.CLOSING,
        CLOSED: WebSocket.CLOSED
      }
    });
    
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
      sentCount++;
      console.log(`✅ Message sent to client ${index + 1}`);
    } else {
      console.log(`❌ Client ${index + 1} not ready (state: ${client.readyState})`);
    }
  });
  
  console.log(`📨 Successfully sent to ${sentCount} out of ${wss.clients.size} clients`);
}

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
    port: parseInt(process.env.SMTP_PORT) || 465,  // Changed from 587 to 465
    secure: true,  // Changed to true for port 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false  // Added for compatibility
    }
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
// NEW (allows inline scripts):
// app.use(helmet({
//     contentSecurityPolicy: {
//       directives: {
//         ...helmet.contentSecurityPolicy.getDefaultDirectives(),
//         "script-src": ["'self'", "'unsafe-inline'"],
//         "script-src-attr": ["'unsafe-inline'"],
//       },
//     },
//   }));

// Better approach - disable CSP for HTML responses only
app.use((req, res, next) => {
    // Disable CSP for HTML responses
    if (req.path.includes('/handle-response') || 
        req.path.includes('/test-oauth-flow') || 
        req.path.includes('/auth/')) {
      return next();
    }
    helmet()(req, res, next);
  });
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
// Add this test route before your main routes
app.get('/test-oauth', (req, res) => {
    const oauthConfig = {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
      clientIdLength: process.env.GOOGLE_CLIENT_ID?.length,
      redirectUri: process.env.GOOGLE_REDIRECT_URI
    };
    
    res.json({
      message: 'OAuth Configuration Test',
      config: oauthConfig,
      timestamp: new Date().toISOString()
    });
  });


// Add this route right after /test-oauth
// Add these routes after your existing /test-oauth route
// ADD THESE NEW ROUTES:
app.get('/test-oauth-flow', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test OAuth Flow</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .btn { 
            background: #667eea; 
            color: white; 
            padding: 15px 30px; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer;
            margin: 10px;
            font-size: 16px;
          }
          .debug { background: #f0f0f0; padding: 20px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>Test OAuth Flow</h1>
        
        <div class="debug">
          <h3>Debug Information:</h3>
          <p><strong>Server:</strong> https://api.suntrenia.com</p>
          <p><strong>Google Client ID:</strong> ${process.env.GOOGLE_CLIENT_ID ? 'Set' : 'MISSING'}</p>
          <p><strong>Redirect URI:</strong> ${process.env.GOOGLE_REDIRECT_URI || 'MISSING'}</p>
        </div>
        
        <button class="btn" onclick="testOAuth()">Test Google OAuth</button>
        <button class="btn" onclick="testCompanyEmail()">Test Company Email</button>
        
        <script>
          function testOAuth() {
            console.log('Testing OAuth...');
            window.location.href = '/auth/google?userId=test123&jobId=job456&emailId=email789&responseId=response123';
          }
          
          function testCompanyEmail() {
            console.log('Testing Company Email...');
            window.location.href = '/auth/use-company-email?userId=test123&jobId=job456&emailId=email789&responseId=response123';
          }
        </script>
      </body>
      </html>
    `);
  });
  
  app.get('/debug-oauth', (req, res) => {
    const debugInfo = {
      server: {
        baseUrl: 'https://api.suntrenia.com',
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
      },
      oauth: {
        clientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'MISSING',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'MISSING',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || 'MISSING',
      },
      timestamp: new Date().toISOString()
    };
    
    res.json({
      message: 'OAuth Debug Information',
      ...debugInfo
    });
  });
  
  app.get('/debug-oauth', (req, res) => {
    const debugInfo = {
      server: {
        baseUrl: 'https://api.suntrenia.com',
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
      },
      oauth: {
        clientId: process.env.GOOGLE_CLIENT_ID ? `Set (first 10 chars: ${process.env.GOOGLE_CLIENT_ID.substring(0, 10)}...)` : 'MISSING',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'MISSING',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || 'MISSING',
        redirectUriMatches: process.env.GOOGLE_REDIRECT_URI === 'https://api.suntrenia.com/auth/google/callback'
      },
      timestamp: new Date().toISOString()
    };
    
    res.json({
      message: 'OAuth Debug Information',
      ...debugInfo
    });
  });
  
  app.get('/env-check', (req, res) => {
    const envVars = {
      EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Missing',
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Missing',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? `Set (length: ${process.env.GOOGLE_CLIENT_ID.length})` : 'Missing',
      GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'Missing',
      NODE_ENV: process.env.NODE_ENV || 'development'
    };
    
    res.json({
      message: 'Environment Variables Check',
      environment: envVars,
      timestamp: new Date().toISOString()
    });
  });
// Add this route to check environment variables
app.get('/env-check', (req, res) => {
    const envVars = {
      EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Missing',
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Missing',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? `Set (length: ${process.env.GOOGLE_CLIENT_ID.length})` : 'Missing',
      GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'Missing',
      NODE_ENV: process.env.NODE_ENV || 'development'
    };
    
    res.json({
      message: 'Environment Variables Check',
      environment: envVars,
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

// Enhanced handle-response - REMOVE OLD IMMEDIATE CHECK
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
  
    console.log('\n🎯 HANDLE-RESPONSE CALLED');
    console.log('📩 Response:', trimmedResponse, 'User:', trimmedUserId);
  
    if (!trimmedResponse || !trimmedEmailId || !trimmedJobId || !trimmedUserId) {
      console.log('❌ Missing required parameters');
      return res.status(400).send('Missing required parameters');
    }
  
    let mongoClient;
  
    try {
      console.log('🗄️ Connecting to MongoDB...');
      mongoClient = new MongoClient(process.env.MONGODB_URI);
      await mongoClient.connect();
      console.log('✅ Connected to MongoDB');
  
      const db = mongoClient.db('olukayode_sage');
  
      // Store the response
      console.log('💾 Storing response in database...');
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
      console.log('✅ Response stored with ID:', insertResult.insertedId);
  
      // ❌ REMOVED: checkForResponsesImmediately(trimmedUserId, trimmedEmailId, trimmedJobId);
      // This is now handled by WebSocket → Frontend → checkForResponses
  
      // Determine response type
      const positiveKeywords = ["proceed", "okay", "yes", "ok", "continue", "thank you", "sure", "please do"];
      const isPositive = positiveKeywords.some(keyword => trimmedResponse.toLowerCase().includes(keyword));
      
      // 🔥 WebSocket notification - Frontend will handle the logic
      const payload = {
        type: trimmedResponse.toLowerCase(),
        userId: trimmedUserId,
        jobId: trimmedJobId,
        emailId: trimmedEmailId,
        responseId: insertResult.insertedId.toString(),
        message: `User selected "${trimmedResponse}"`,
        companyName: trimmedCompanyName,
        jobTitle: trimmedJobTitle,
        timestamp: new Date().toISOString()
      };
  
    //   wss.clients.forEach(client => {
    //     if (client.readyState === WebSocket.OPEN) {
    //       client.send(JSON.stringify(payload));
    //     }
    //   });
    //   console.log('📢 WebSocket notification sent to all connected clients');
  
    // ✅ WITH THIS NEW CODE:
        // ✅ CORRECT - use the payload variable that you defined
        console.log('🚀 Sending WebSocket notification...');
        broadcastToClients(payload); // ✅ Use the correct variable name

      await mongoClient.close();
      console.log('✅ MongoDB connection closed');
  
      // Send appropriate HTML response
      if (isPositive) {
        // Check if user is already authorized
        const isAuthorized = await checkIfUserAuthorized(trimmedUserId);
        
        if (isAuthorized) {
          console.log('✅ User already authorized - showing proceeding page');
          res.send(getAlreadyAuthorizedHTML(trimmedUserId, trimmedCompanyName, trimmedJobTitle));
        } else {
          console.log('❌ User needs authorization - showing auth options');
          res.send(getAuthorizationHTML(trimmedUserId, trimmedJobId, trimmedEmailId, insertResult.insertedId));
        }
      } else {
        // Negative response
        console.log('❌ User declined - showing declined page');
        res.send(getDeclinedHTML());
      }
      
    } catch (err) {
      console.error('❌ ERROR in handle-response:', err);
      console.error('❌ Error stack:', err.stack);
      
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
  function getDeclinedHTML() {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Response Received</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
      animation: slideUp 0.6s ease-out;
    }
    
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .circle {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, #ff9966 0%, #ff5e62 100%);
      border-radius: 50%;
      margin: 0 auto 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 15px 35px rgba(255, 94, 98, 0.3);
      animation: scaleIn 0.5s ease;
    }
    
    @keyframes scaleIn {
      from { transform: scale(0); }
      to { transform: scale(1); }
    }
    
    .icon {
      color: white;
      font-size: 38px;
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
      margin-bottom: 20px;
      line-height: 1.6;
    }
    
    .btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 40px;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 700;
      font-size: 15px;
      transition: transform 0.2s;
      margin-top: 20px;
    }
    
    .btn:hover {
      transform: translateY(-2px);
    }
    
    .footer {
      margin-top: 35px;
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
    <div class="circle">
      <div class="icon">✓</div>
    </div>
    <h1>Response Received</h1>
    <p>We've noted your decision not to proceed with this application.</p>
    <button class="btn" onclick="closeWindow()">Close Window</button>
    <div class="footer">
      Powered by <strong>IntelliJob</strong> from Suntrenia
    </div>
  </div>
  
  <script>
    console.log('Response processed successfully');
    
    function closeWindow() {
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
    }
  </script>
  </body>
  </html>`;
  }
  function getAlreadyAuthorizedHTML(userId, companyName, jobTitle) {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Processing Application</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      background-size: 300% 300%;
      animation: gradientShift 6s ease infinite;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    @keyframes gradientShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    
    .container {
      max-width: 550px;
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(30px);
      padding: 50px 40px;
      border-radius: 28px;
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.2);
      text-align: center;
      animation: slideUp 0.6s ease-out;
    }
    
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(40px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .icon-wrapper {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, #00c851 0%, #007e33 100%);
      border-radius: 50%;
      margin: 0 auto 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: scaleIn 0.5s ease 0.3s both;
    }
    
    @keyframes scaleIn {
      from { transform: scale(0); }
      to { transform: scale(1); }
    }
    
    .icon-wrapper svg {
      width: 50px;
      height: 50px;
      stroke: white;
      fill: none;
      stroke-width: 3;
      animation: drawCheck 0.5s 0.8s ease forwards;
      stroke-dasharray: 100;
      stroke-dashoffset: 100;
    }
    
    @keyframes drawCheck {
      to { stroke-dashoffset: 0; }
    }
    
    h1 {
      color: #1a202c;
      font-size: 32px;
      font-weight: 900;
      margin-bottom: 15px;
      animation: fadeIn 0.6s ease 0.4s both;
    }
    
    p {
      color: #4a5568;
      font-size: 17px;
      line-height: 1.7;
      margin-bottom: 15px;
      animation: fadeIn 0.6s ease 0.6s both;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .job-details {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
      border-left: 4px solid #667eea;
      padding: 20px;
      border-radius: 12px;
      margin: 25px 0;
      text-align: left;
      animation: fadeIn 0.6s ease 0.8s both;
    }
    
    .job-details h3 {
      color: #1a202c;
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .job-details p {
      color: #4a5568;
      font-size: 15px;
      margin: 0;
    }
    
    .auto-mode-tip {
      background: #fff3cd;
      border: 2px solid #ffc107;
      border-radius: 12px;
      padding: 20px;
      margin-top: 25px;
      text-align: left;
      animation: fadeIn 0.6s ease 1s both;
    }
    
    .auto-mode-tip h3 {
      color: #856404;
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .auto-mode-tip p {
      color: #856404;
      font-size: 14px;
      line-height: 1.6;
      margin: 0;
    }
    
    .auto-mode-tip strong {
      color: #664d03;
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
      margin-top: 30px;
      transition: transform 0.2s;
      animation: fadeIn 0.6s ease 1.2s both;
    }
    
    .btn:hover {
      transform: translateY(-2px);
    }
    
    .footer {
      margin-top: 30px;
      color: #718096;
      font-size: 14px;
      animation: fadeIn 0.6s ease 1.4s both;
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
    <div class="icon-wrapper">
      <svg viewBox="0 0 52 52">
        <polyline points="14,27 22,35 38,19" />
      </svg>
    </div>
    
    <h1>We're On It! 🚀</h1>
    
    <p>Great! We're now proceeding with your application.</p>
    
    <div class="job-details">
      <h3>📋 Application Details</h3>
      <p><strong>Company:</strong> ${companyName}</p>
      <p><strong>Position:</strong> ${jobTitle}</p>
    </div>
    
    <p>Your application will be submitted shortly using your authorized email.</p>
    
    <div class="auto-mode-tip">
      <h3>💡 Pro Tip: Enable Auto Mode</h3>
      <p>Want to skip this step next time? Go to your <strong>Dashboard → Settings</strong> and enable <strong>Auto Mode</strong>. We'll automatically process applications without asking for confirmation!</p>
    </div>
    
    <button class="btn" onclick="closeWindow()">Close Window</button>
    
    <div class="footer">
      Powered by <strong>IntelliJob</strong> from Suntrenia
    </div>
  </div>
  
  <script>
    console.log('✅ Already authorized - proceeding with application');
    
    function closeWindow() {
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
    }
    
    // Auto-close after 10 seconds
    setTimeout(() => {
      console.log('Auto-closing window...');
      closeWindow();
    }, 10000);
  </script>
  </body>
  </html>`;
  }



function getAuthorizationHTML(userId, jobId, emailId, responseId) {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Authorization</title>
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
        console.log('🔵 authorizeGmail() function called');
        console.log('🔵 Current location:', window.location.href);
        
        // Show loading immediately
        const loading = document.getElementById('loading');
        if (loading) {
          loading.classList.add('active');
          console.log('🔵 Loading overlay activated');
        }
        
        // Validate parameters
        console.log('🔵 Parameters:', { userId, jobId, emailId, responseId });
        
        if (!userId || !jobId) {
          alert('Error: Missing required parameters. Please contact support.');
          if (loading) loading.classList.remove('active');
          return;
        }
        
        // Build the redirect URL
        const params = new URLSearchParams({ 
          userId: userId || '', 
          jobId: jobId || '', 
          emailId: emailId || '', 
          responseId: responseId || '' 
        });
        
        const redirectUrl = '/auth/google?' + params.toString();
        console.log('🔵 Built redirect URL:', redirectUrl);
        console.log('🔵 Full URL will be:', window.location.origin + redirectUrl);
        
        // Add a small delay to ensure loading shows
        setTimeout(() => {
          console.log('🔵 Executing redirect NOW...');
          try {
            window.location.href = redirectUrl;
            console.log('🔵 Redirect command executed');
          } catch (error) {
            console.error('🔵 Redirect failed:', error);
            alert('Redirect failed: ' + error.message);
            if (loading) loading.classList.remove('active');
          }
        }, 100);
      }

    function useCompanyEmail() {
      if (confirm('Are you sure you want to use our company email? Using your personal Gmail is recommended for better response rates.')) {
        const loading = document.getElementById('loading');
        if (loading) {
          loading.classList.add('active');
        }
        
        const params = new URLSearchParams({ userId, jobId, emailId, responseId });
        const redirectUrl = '/auth/use-company-email?' + params.toString();
        
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 100);
      }
    }

    // Debug info
    console.log('🔧 Authorization page loaded with:', { userId, jobId, emailId, responseId });
  </script>
  </body>
  </html>`;
  }
  

// Success HTML function
function getSuccessHTML() {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Authorization Complete</title>
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
  </div>
  </body>
  </html>`;
  }
  


  app.get('/auth/google', (req, res) => {
    console.log('\n🔵 ============ /auth/google ROUTE HIT ============');
    console.log('🔵 Timestamp:', new Date().toISOString());
    console.log('🔵 Full URL:', req.url);
    console.log('🔵 Query parameters:', JSON.stringify(req.query, null, 2));
    console.log('🔵 Headers:', JSON.stringify(req.headers, null, 2));
    
    const { userId, jobId, emailId, responseId } = req.query;
    
    // Log each parameter individually
    console.log('🔵 userId:', userId);
    console.log('🔵 jobId:', jobId);
    console.log('🔵 emailId:', emailId);
    console.log('🔵 responseId:', responseId);
    
    // Validate required parameters
    if (!userId || !jobId) {
      console.log('❌ VALIDATION FAILED - Missing required parameters');
      console.log('❌ userId present?', !!userId);
      console.log('❌ jobId present?', !!jobId);
      
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Missing Parameters</title>
          <style>
            body { 
              font-family: Arial; 
              padding: 40px; 
              text-align: center;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              max-width: 500px;
            }
            .error { color: #e53e3e; font-weight: bold; }
            .debug { 
              background: #f7fafc; 
              padding: 15px; 
              border-radius: 8px; 
              margin: 20px 0;
              text-align: left;
              font-family: monospace;
              font-size: 12px;
            }
            .btn {
              background: #667eea;
              color: white;
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              margin: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">⚠️ Missing Parameters</h1>
            <p>Required parameters are missing. Please try again.</p>
            <div class="debug">
              <strong>Debug Info:</strong><br>
              userId: ${userId || 'MISSING'}<br>
              jobId: ${jobId || 'MISSING'}<br>
              emailId: ${emailId || 'not required'}<br>
              responseId: ${responseId || 'not required'}
            </div>
            <button class="btn" onclick="window.history.back()">Go Back</button>
            <button class="btn" onclick="window.location.href='/test-oauth-flow'">Test OAuth Flow</button>
          </div>
        </body>
        </html>
      `);
    }
    
    // Check OAuth configuration
    console.log('🔵 Checking OAuth configuration...');
    console.log('🔵 GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
    console.log('🔵 GOOGLE_CLIENT_ID length:', process.env.GOOGLE_CLIENT_ID?.length);
    console.log('🔵 GOOGLE_CLIENT_ID preview:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
    console.log('🔵 GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);
    console.log('🔵 GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
    
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REDIRECT_URI) {
      console.log('❌ OAuth configuration MISSING');
      return res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>OAuth Not Configured</title>
          <style>
            body { 
              font-family: Arial; 
              padding: 40px; 
              text-align: center;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              max-width: 500px;
            }
            .error { color: #e53e3e; font-weight: bold; }
            .btn {
              background: #667eea;
              color: white;
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              margin: 10px;
              text-decoration: none;
              display: inline-block;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">⚙️ OAuth Not Configured</h1>
            <p>Google OAuth is not properly configured on the server.</p>
            <p><strong>Missing:</strong> ${!process.env.GOOGLE_CLIENT_ID ? 'Client ID ' : ''}${!process.env.GOOGLE_REDIRECT_URI ? 'Redirect URI' : ''}</p>
            <a class="btn" href="/auth/use-company-email?userId=${userId}&jobId=${jobId}&emailId=${emailId || ''}&responseId=${responseId || ''}">Use Company Email Instead</a>
            <button class="btn" onclick="window.history.back()">Go Back</button>
          </div>
        </body>
        </html>
      `);
    }
    
    try {
      // Build state parameter
      const stateData = { userId, jobId, emailId, responseId };
      const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
      
      console.log('🔵 State data:', JSON.stringify(stateData));
      console.log('🔵 Encoded state:', state);
      
      // ⭐ KEY CHANGE: Added userinfo.email scope
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(process.env.GOOGLE_CLIENT_ID)}&` +
        `redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email')}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${encodeURIComponent(state)}`;
      
      console.log('🔵 Full Google OAuth URL (first 200 chars):', googleAuthUrl.substring(0, 200));
      console.log('✅ Redirecting to Google OAuth NOW...');
      console.log('🔵 ============ END /auth/google ============\n');
      
      res.redirect(googleAuthUrl);
      
    } catch (error) {
      console.error('❌ ERROR building OAuth URL:', error);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      return res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Redirect Error</title>
          <style>
            body { 
              font-family: Arial; 
              padding: 40px; 
              text-align: center;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              max-width: 500px;
            }
            .error { color: #e53e3e; font-weight: bold; }
            .debug { 
              background: #f7fafc; 
              padding: 15px; 
              border-radius: 8px; 
              margin: 20px 0;
              text-align: left;
              font-family: monospace;
              font-size: 12px;
            }
            .btn {
              background: #667eea;
              color: white;
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              margin: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">⚠️ Redirect Error</h1>
            <p>Unable to redirect to Google OAuth. Please try again.</p>
            <div class="debug">
              <strong>Error Details:</strong><br>
              ${error.message}
            </div>
            <button class="btn" onclick="window.history.back()">Go Back</button>
            <button class="btn" onclick="window.location.href='/debug-oauth'">View Debug Info</button>
          </div>
        </body>
        </html>
      `);
    }
  });


// 👇 ADD THE TEST ROUTE RIGHT HERE 👇
app.get('/test-auth-route', (req, res) => {
    console.log('✅ Test route working!');
    res.json({
      message: 'Auth routes are accessible',
      availableRoutes: [
        '/auth/google',
        '/auth/google/callback',
        '/auth/use-company-email'
      ],
      timestamp: new Date().toISOString()
    });
  });

  // Fallback route if OAuth is not configured
app.get('/auth/fallback', (req, res) => {
    const { userId, jobId, emailId, responseId } = req.query;
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>OAuth Not Available</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
          .container { max-width: 500px; margin: 0 auto; }
          .btn { 
            background: #667eea; 
            color: white; 
            padding: 12px 24px; 
            border: none; 
            border-radius: 6px; 
            cursor: pointer;
            margin: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Gmail Authorization Not Available</h1>
          <p>Personal Gmail authorization is currently not configured.</p>
          <p>Please use the company email option instead.</p>
          <button class="btn" onclick="useCompanyEmail()">Use Company Email</button>
          <button class="btn" onclick="window.history.back()">Go Back</button>
        </div>
        <script>
          function useCompanyEmail() {
            const params = new URLSearchParams(${JSON.stringify({ userId, jobId, emailId, responseId })});
            window.location.href = '/auth/use-company-email?' + params.toString();
          }
        </script>
      </body>
      </html>
    `);
  });
// OAuth callback route - SURGICAL UPDATE
// OAuth callback route - FIXED VERSION
// ============================================
app.get('/auth/google/callback', async (req, res) => {
    console.log('\n🔵 ============ OAUTH CALLBACK HIT ============');
    const { code, state, error } = req.query;
    
    if (error) {
      console.error('❌ OAuth error:', error);
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Authorization Failed</title></head>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
          <h1>❌ Authorization Failed</h1>
          <p>Error: ${error}</p>
          <button onclick="window.close()">Close Window</button>
        </body>
        </html>
      `);
    }
    
    if (!code) {
      return res.status(400).send('Authorization failed - no code received');
    }
    
    let mongoClient;
    
    try {
      // Decode state
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      const { userId, jobId, emailId, responseId } = stateData;
      
      console.log('🔵 User:', userId);
      
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
      
      if (!tokenResponse.ok) {
        throw new Error('Token exchange failed');
      }
      
      const tokens = await tokenResponse.json();
      console.log('✅ Token exchange successful');
      // ⭐ ADDED: More detailed token logging
      console.log('🔑 Token info:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expires_in,
        scope: tokens.scope
      });
      
      // ⭐ ADDED: Log before fetching user info
      console.log('📧 Fetching user info from Google...');
      
      // ⭐ ENHANCED: Better error handling for user info fetch
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: 'application/json'
        }
      });
      
      console.log('📊 User info response status:', userInfoResponse.status);
      
      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        console.error('❌ User info error response:', errorText);
        throw new Error(`Failed to get user info: ${userInfoResponse.status} - ${errorText}`);
      }
      
      const userInfo = await userInfoResponse.json();
      
      // ⭐ ADDED: Validate we got an email
      if (!userInfo.email) {
        console.error('❌ No email in user info:', userInfo);
        throw new Error('Google did not return an email address');
      }
      
      console.log('📧 User email from Google:', userInfo.email);
      
      // 🔥 STORE AUTHORIZATION IN DATABASE
      mongoClient = new MongoClient(process.env.MONGODB_URI);
      await mongoClient.connect();
      const db = mongoClient.db('olukayode_sage');
      
      const authData = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        userEmail: userInfo.email,
        updatedAt: new Date(),
        usePersonalEmail: true,
        authorizedAt: new Date(),
        isAuthorized: true
      };
      
      console.log('💾 Storing auth data:', authData);
      
      await db.collection('user_gmail_tokens').updateOne(
        { userId },
        { $set: authData },
        { upsert: true }
      );
      
      await mongoClient.close();
      
      console.log('✅ Authorization stored in database with email:', userInfo.email);
      
      // 🔥 EMIT WEBSOCKET EVENT: USER AUTHORIZED
      const wsPayload = {
        type: 'user_authorized',
        userId,
        jobId,
        emailId,
        responseId,
        message: 'User has been authorized successfully',
        userEmail: userInfo.email,
        timestamp: new Date().toISOString()
      };
      
      console.log('🚀 Sending WebSocket notification...');
      broadcastToClients(wsPayload);
      
      // Show success page
      res.send(getSuccessHTML());
      
    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      console.error('❌ Error details:', error.message);
      
      if (mongoClient) {
        await mongoClient.close();
      }
      
      res.status(500).send('Authorization failed. Please try again.');
    }
  });
  // Route for using company email - SURGICAL UPDATE
// Route for using company email - SURGICAL UPDATE
// Route for using company email - FIXED WITH EMAIL
// Route for using company email - FIXED VERSION
app.get('/auth/use-company-email', async (req, res) => {
    const { userId, jobId, emailId, responseId } = req.query;
    
    console.log('\n🏢 Using company email for user:', userId);
    
    let mongoClient;
    
    try {
      mongoClient = new MongoClient(process.env.MONGODB_URI);
      await mongoClient.connect();
      const db = mongoClient.db('olukayode_sage');
      
      // Use the actual email from environment variables
      const companyEmail = process.env.COMPANY_EMAIL || process.env.EMAIL_USER;
      console.log('📧 Storing company email:', companyEmail);
      
      // 🔥 STORE AUTHORIZATION (COMPANY EMAIL MODE) WITH EMAIL
      const authData = {
        usePersonalEmail: false,
        userEmail: companyEmail, // ✅ Store the actual email
        updatedAt: new Date(),
        authorizedAt: new Date(),
        isAuthorized: true
      };
      
      console.log('💾 Storing auth data:', authData);
      
      await db.collection('user_gmail_tokens').updateOne(
        { userId },
        { $set: authData },
        { upsert: true }
      );
      
      await mongoClient.close();
      
      console.log('✅ Company email authorization stored with email:', companyEmail);
      
      // 🔥 EMIT WEBSOCKET EVENT: USER AUTHORIZED
      const wsPayload = {
        type: 'user_authorized',
        userId,
        jobId,
        emailId,
        responseId,
        message: 'User has been authorized (company email)',
        userEmail: companyEmail,
        timestamp: new Date().toISOString()
      };
      
      console.log('🚀 Sending WebSocket notification...');
      broadcastToClients(wsPayload);
      
      // Show success page
      res.send(getSuccessHTML());
      
    } catch (error) {
      console.error('❌ Error setting company email:', error);
      
      if (mongoClient) {
        await mongoClient.close();
      }
      
      res.status(500).send('An error occurred. Please try again.');
    }
  });
  async function checkIfUserAuthorized(userId) {
    let client;
    try {
      client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      console.log('🔍 Checking authorization for user:', userId);
      
      const db = client.db('olukayode_sage');
      const userAuth = await db.collection('user_gmail_tokens').findOne({ userId });
  
      // No record at all — unauthorized
      if (!userAuth) {
        console.log(`❌ No authorization record for user ${userId}`);
        return false;
      }
  
      // Check explicit flag
      if (!userAuth.isAuthorized) {
        console.log(`❌ User ${userId} not authorized`);
        return false;
      }
  
      // If using company email
      if (userAuth.usePersonalEmail === false) {
        console.log(`✅ User ${userId} authorized (company email)`);
        return true;
      }
  
      // If using personal Gmail
      if (userAuth.usePersonalEmail === true && userAuth.accessToken) {
        console.log(`✅ User ${userId} authorized (personal Gmail)`);
        return true;
      }
  
      console.log(`⚠️ Incomplete authorization for user ${userId}`);
      return false;
  
    } catch (error) {
      console.error('❌ Error checking authorization:', error);
      throw error;
    } finally {
      if (client) {
        await client.close();
      }
    }
  }
  
// Add this endpoint for frontend to check authorization status
app.get('/check-user-auth', async (req, res) => {
    const { userId } = req.query;
    
    console.log('🔍 Checking user auth for:', userId);
    
    try {
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      
      const db = client.db('olukayode_sage');
      const userAuth = await db.collection('user_gmail_tokens').findOne({ userId });
      
      await client.close();
      
      const authorized = userAuth && userAuth.isAuthorized;
      
      console.log('📋 Auth check result:', {
        authorized,
        userEmail: userAuth?.userEmail,
        usePersonalEmail: userAuth?.usePersonalEmail
      });
      
      res.json({
        authorized,
        userEmail: userAuth?.userEmail,
        usePersonalEmail: userAuth?.usePersonalEmail,
        authorizedAt: userAuth?.authorizedAt
      });
      
    } catch (error) {
      console.error('❌ Error checking user auth:', error);
      res.status(500).json({ error: 'Failed to check authorization' });
    }
  });
app.get('/test-websocket', (req, res) => {
  const { userId, message } = req.query;
  
  const testPayload = {
    type: 'test_message',
    userId: userId || 'test-user',
    message: message || 'Test WebSocket message',
    timestamp: new Date().toISOString()
  };
  
  console.log('🧪 Sending test WebSocket message...');
  broadcastToClients(testPayload); // 👈 CALL THE FUNCTION HERE
  
  res.json({
    success: true,
    message: 'Test WebSocket message sent',
    payload: testPayload
  });
});
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
