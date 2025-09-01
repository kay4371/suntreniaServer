//const express = require('express');
// const { MongoClient } = require('mongodb');
// const dotenv = require('dotenv').config();
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(cors());
// app.use(helmet());
// app.use(express.json());
// app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// // Test route
// app.get('/', (req, res) => {
//   res.send('🟢 Backend is running (CommonJS)');
// });

// // Handle email responses
// app.get('/handle-response', async (req, res) => {
//   const { response, emailId, jobId } = req.query;
//   console.log('📩 Received:', { response, emailId, jobId });
 
//   try {
   
//     const client = new MongoClient(process.env.MONGODB_URI);
//     await client.connect();
//     const db = client.db('suntrenia');
//     await db.collection('responses').insertOne({
//       response,
//       emailId,
//       jobId,
//       timestamp: new Date()
//     });
//     await client.close();

    
//     res.send(`
//       <h1>✅ Success!</h1>
//       <p>Recorded: ${response} (job ${jobId})</p>
//     `);
//   } catch (err) {
//     console.error('❌ MongoDB Error:', err);
//     res.status(500).send('Database error');
//   }
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });













// const express = require('express');
// const { MongoClient } = require('mongodb');
// const dotenv = require('dotenv').config();
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(cors());
// app.use(helmet());
// app.use(express.json());
// app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// // Test route
// app.get('/', (req, res) => {
//   res.send('🟢 Backend is running (CommonJS)');
// });

// // Handle email responses
// app.get('/handle-response', async (req, res) => {
//   const { response, emailId, jobId } = req.query;
//   console.log('📩 Received:', { response, emailId, jobId });
 
//   try {
//     const client = new MongoClient(process.env.MONGODB_URI);
//     await client.connect();
    
//     const db = client.db('olukayode_sage');
//     // ✅ Store the insert result in a variable
//     const insertResult = await db.collection('user_application_response').insertOne({
//       response,
//       emailId,
//       jobId,
//       timestamp: new Date()
//     });
    
//     console.log('Insert result:', insertResult);
//     console.log("Checking for responses now...");
    
//     // [ADDED] Check for responses - only if function exists
//     try {
//       if (typeof checkForResponses === 'function') {
//         // Use emailId and jobId from query, generate userId fallback
//         const userId = 'default_user_id'; // Simplified like local version approach
//         await checkForResponses(userId, emailId, jobId);
//       } else {
//         console.log('checkForResponses function not available in this environment');
//       }
//     } catch (error) {
//       console.error('Error in checkForResponses:', error);
//     }

//     await client.close();

// res.send(`
//   <!DOCTYPE html>
//   <html lang="en">
//   <head>
//     <meta charset="UTF-8" />
//     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//     <title>Success</title>
//     <style>
//       body {
//         font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//         display: flex;
//         justify-content: center;
//         align-items: center;
//         height: 100vh;
//         background: #f4fdf6;
//         margin: 0;
//       }
//       .container {
//         text-align: center;
//         animation: fadeIn 1s ease-in-out;
//         max-width: 350px;
//       }
//       .circle {
//         width: 100px;
//         height: 100px;
//         background: #a3e635;
//         border-radius: 50%;
//         display: flex;
//         justify-content: center;
//         align-items: center;
//         margin: 0 auto 20px;
//         animation: pop 0.6s ease forwards;
//       }
//       .tick {
//         font-size: 48px;
//         color: white;
//         animation: scaleUp 0.5s ease forwards 0.5s;
//         opacity: 0;
//       }
//       h1 {
//         font-size: 1.8rem;
//         color: #166534;
//         margin-bottom: 10px;
//       }
//       p {
//         font-size: 1rem;
//         color: #4b5563;
//         margin-bottom: 25px;
//       }
//       .btn {
//         width: 200px;
//         padding: 12px;
//         border-radius: 25px;
//         border: none;
//         cursor: pointer;
//         font-size: 0.95rem;
//         margin: 8px auto;
//         display: block;
//         transition: transform 0.2s ease, background 0.3s ease;
//       }
//       .btn:hover {
//         transform: scale(1.05);
//       }
//       .btn-green {
//         background: #22c55e;
//         color: white;
//       }
//       .btn-green:hover {
//         background: #16a34a;
//       }
//       .btn-red {
//         background: #ef4444;
//         color: white;
//       }
//       .btn-red:hover {
//         background: #dc2626;
//       }
//       .footer {
//         margin-top: 30px;
//         font-size: 0.8rem;
//         color: #6b7280;
//       }
//       @keyframes fadeIn {
//         from { opacity: 0; }
//         to { opacity: 1; }
//       }
//       @keyframes pop {
//         0% { transform: scale(0.5); opacity: 0; }
//         100% { transform: scale(1); opacity: 1; }
//       }
//       @keyframes scaleUp {
//         to { transform: scale(1.1); opacity: 1; }
//       }
//     </style>
//   </head>
//   <body>
//     <div class="container">
//       <div class="circle">
//         <div class="tick">✔</div>
//       </div>
//       <h1>Good Choice</h1>
//       <p>We will now proceed with your application.</p>
//       <button class="btn btn-green" onclick="alert('Auto-Apply enabled ✅. We’ll handle future applications for you ✨')">
//         Enable Auto-Apply (next time)
//       </button>
//       <button class="btn btn-red" onclick="window.close()">
//         Exit
//       </button>
//       <div class="footer">
//         IntelliJob from <strong>Suntrenia</strong>
//       </div>
//     </div>
//     <script>
//       // Reveal tick after circle pops
//       setTimeout(() => {
//         document.querySelector('.tick').style.opacity = '1';
//       }, 600);
//     </script>
//   </body>
//   </html>
// `);


//   } catch (err) {
//     console.error('❌ MongoDB Error:', err);
//     res.status(500).send('Database error');
//   }
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });



const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv').config();
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// SMTP Configuration for SENDING emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// IMAP Configuration for READING emails
const imapConfig = {
  imap: {
    user: process.env.IMAP_USER,
    password: process.env.IMAP_PASSWORD,
    host: process.env.IMAP_HOST || "imap.gmail.com",
    port: parseInt(process.env.IMAP_PORT) || 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  }
};

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Test route
app.get('/', (req, res) => {
  res.send('🟢 Backend is running with environment variables');
});

// Real checkForResponses function (now as an endpoint)
app.get('/check-responses', async (req, res) => {
  const { userId, emailId, jobId } = req.query;
  
  console.log('🔍 Checking responses with:', { userId, emailId, jobId });
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  let connection;
  let mongoClient;

  try {
    console.log(`Starting response check for user: ${userId}`);
    
    // Connect to IMAP server
    connection = await imaps.connect(imapConfig);
    await connection.openBox('INBOX');
    
    // Search for unread emails
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };
    
    const messages = await connection.search(searchCriteria, fetchOptions);
    
    if (messages.length === 0) {
      console.log('No new responses found.');
      await connection.end();
      return res.json({ success: true, responsesFound: 0, message: 'No new responses' });
    }
    
    // Connect to MongoDB
    mongoClient = new MongoClient(process.env.MONGODB_URI);
    await mongoClient.connect();
    const db = mongoClient.db('olukayode_sage');
    const collection = db.collection('user_application_response');
    
    let processedCount = 0;
    let positiveResponses = 0;
    let negativeResponses = 0;
    
    // Process each email
    for (const message of messages) {
      const textPart = message.parts.find(part => part.which === 'TEXT');
      const id = message.attributes.uid;
      const rawMessage = textPart?.body;
      
      if (!rawMessage) {
        console.log('No message body found for this email.');
        continue;
      }
      
      // Parse the email
      const parsedEmail = await simpleParser(rawMessage);
      const from = parsedEmail.from?.text || 'Unknown sender';
      const subject = parsedEmail.subject || 'No subject';
      const textBody = parsedEmail.text || 'No message body';
      
      console.log(`New response from: ${from}`);
      console.log(`Subject: ${subject}`);
      
      // Extract user response from email
      let normalizedTextBody = textBody.toLowerCase();
      normalizedTextBody = normalizedTextBody.replace(/<\/?[^>]+(>|$)/g, "");
      normalizedTextBody = normalizedTextBody.replace(/\s+/g, ' ').trim();
      
      const quotedMessageIndex = normalizedTextBody.search(/on .* wrote:/i);
      let userResponse = quotedMessageIndex !== -1
        ? normalizedTextBody.slice(0, quotedMessageIndex).trim()
        : normalizedTextBody;
      
      // Check if we have a button response in DB (if emailId and jobId provided)
      if (emailId && jobId) {
        try {
          const buttonResponseRecord = await collection.findOne({
            userId: userId,
            jobId: jobId,
            emailId: emailId
          });
          
          if (buttonResponseRecord && buttonResponseRecord.response) {
            console.log("✅ Button response retrieved from DB:", buttonResponseRecord.response);
            userResponse = buttonResponseRecord.response.toLowerCase();
          }
        } catch (e) {
          console.error('Error fetching button response from DB:', e);
        }
      }
      
      // Determine if response is positive or negative
      const positiveKeywords = ["proceed", "okay", "yes", "ok", "continue", "thank you", "sure", "please do"];
      const isPositive = positiveKeywords.some(keyword => userResponse.includes(keyword));
      
      if (isPositive) {
        console.log("✅ Positive response detected:", userResponse);
        positiveResponses++;
        // Update application status in database
        await db.collection('applications').updateOne(
          { userId, jobId },
          { $set: { status: 'approved', respondedAt: new Date() } }
        );
      } else {
        console.log("❌ Negative response detected:", userResponse);
        negativeResponses++;
        await db.collection('applications').updateOne(
          { userId, jobId },
          { $set: { status: 'rejected', respondedAt: new Date() } }
        );
      }
      
      processedCount++;
    }
    
    await connection.end();
    await mongoClient.close();
    
    console.log(`Processed ${processedCount} responses`);
    res.json({ 
      success: true, 
      responsesFound: messages.length, 
      processed: processedCount,
      positiveResponses,
      negativeResponses
    });
    
  } catch (error) {
    console.error('Error in checkForResponses:', error);
    
    if (connection) {
      await connection.end();
    }
    if (mongoClient) {
      await mongoClient.close();
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Handle email responses
app.get('/handle-response', async (req, res) => {
  const { response, emailId, jobId, userId } = req.query;
  console.log('📩 Received:', { response, emailId, jobId, userId });
 
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db('olukayode_sage');
    
    // Store the response
    const insertResult = await db.collection('user_application_response').insertOne({
      userId: userId || 'unknown',
      response,
      emailId,
      jobId,
      timestamp: new Date()
    });
    
    console.log('Response stored in DB:', insertResult.insertedId);
    
    // If we have all required parameters, check for responses immediately
    if (userId && emailId && jobId) {
      try {
        const checkResult = await checkForResponsesImmediately(userId, emailId, jobId);
        console.log('Immediate response check completed:', checkResult);
      } catch (error) {
        console.error('Error in immediate response check:', error);
      }
    }

    await client.close();

    // Send the HTML response
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Success</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(135deg, #f4fdf6 0%, #e8f5e9 100%);
            margin: 0;
          }
          .container {
            text-align: center;
            animation: fadeIn 1s ease-in-out;
            max-width: 400px;
            padding: 30px;
            background: white;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          }
          .circle {
            width: 130px;
            height: 130px;
            background: #a3e635;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0 auto 25px;
            animation: pop 0.6s ease forwards;
            box-shadow: 0 5px 15px rgba(163, 230, 53, 0.4);
          }
          .tick {
            font-size: 60px;
            color: white;
            animation: scaleUp 0.5s ease forwards 0.5s;
            opacity: 0;
          }
          h1 {
            font-size: 1.9rem;
            color: #166534;
            margin-bottom: 15px;
          }
          p {
            font-size: 1.05rem;
            color: #4b5563;
            margin-bottom: 30px;
            line-height: 1.5;
          }
          .button-row {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-bottom: 25px;
          }
          .btn {
            padding: 14px 25px;
            border-radius: 30px;
            border: none;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            transition: all 0.3s ease;
            min-width: 160px;
          }
          .btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
          }
          .btn:active {
            transform: translateY(0);
          }
          .btn-green {
            background: #22c55e;
            color: white;
          }
          .btn-green:hover {
            background: #16a34a;
          }
          .btn-purple {
            background: #6b21a8;
            color: white;
          }
          .btn-purple:hover {
            background: #581c87;
          }
          .footer {
            margin-top: 30px;
            font-size: 0.85rem;
            color: #6b7280;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pop {
            0% { transform: scale(0.5); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes scaleUp {
            to { transform: scale(1.1); opacity: 1; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="circle">
            <div class="tick">✔</div>
          </div>
          <h1>Excellent Choice!</h1>
          <p>We've received your response and will now proceed with your application.</p>
          <div class="button-row">
            <button class="btn btn-green" onclick="window.location.href='/dashboard/settings'">
              Auto-Apply
            </button>
            <button class="btn btn-purple" onclick="window.close()">
              Exit
            </button>
          </div>
          <div class="footer">
            Powered by <strong>IntelliJob</strong> from Suntrenia
          </div>
        </div>
        <script>
          setTimeout(() => {
            document.querySelector('.tick').style.opacity = '1';
          }, 600);
        </script>
      </body>
      </html>
    `);

  } catch (err) {
    console.error('❌ Error in handle-response:', err);
    res.status(500).send('Server error');
  }
});

// Helper function for immediate checking (used by handle-response)
async function checkForResponsesImmediately(userId, emailId, jobId) {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db('olukayode_sage');
    const collection = db.collection('user_application_response');
    
    // Check for button response in DB
    const buttonResponseRecord = await collection.findOne({
      userId: userId,
      jobId: jobId,
      emailId: emailId
    });
    
    if (buttonResponseRecord && buttonResponseRecord.response) {
      console.log("✅ Button response found:", buttonResponseRecord.response);
      const userResponse = buttonResponseRecord.response.toLowerCase();
      
      // Determine if response is positive or negative
      const positiveKeywords = ["proceed", "okay", "yes", "ok", "continue", "thank you", "sure", "please do"];
      const isPositive = positiveKeywords.some(keyword => userResponse.includes(keyword));
      
      if (isPositive) {
        console.log("✅ Positive response detected - proceeding with application");
        // Update application status in database
        await db.collection('applications').updateOne(
          { userId, jobId },
          { $set: { status: 'approved', respondedAt: new Date() } }
        );
      } else {
        console.log("❌ Negative response detected - stopping application");
        await db.collection('applications').updateOne(
          { userId, jobId },
          { $set: { status: 'rejected', respondedAt: new Date() } }
        );
      }
    }
    
    await client.close();
    return { success: true };
    
  } catch (error) {
    console.error('Error in immediate check:', error);
    throw error;
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 IMAP User: ${process.env.IMAP_USER}`);
  console.log(`📧 SMTP User: ${process.env.SMTP_USER}`);
});



