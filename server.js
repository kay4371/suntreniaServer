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



// const express = require('express');
// const { MongoClient, ObjectId } = require('mongodb');
// const dotenv = require('dotenv').config();
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// const imaps = require('imap-simple');
// const { simpleParser } = require('mailparser');
// const nodemailer = require('nodemailer');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // SMTP Configuration for SENDING emails
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST || "smtp.gmail.com",
//   port: parseInt(process.env.SMTP_PORT) || 587,
//   secure: process.env.SMTP_SECURE === "true",
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASSWORD,
//   },
// });

// // IMAP Configuration for READING emails
// const imapConfig = {
//   imap: {
//     user: process.env.IMAP_USER,
//     password: process.env.IMAP_PASSWORD,
//     host: process.env.IMAP_HOST || "imap.gmail.com",
//     port: parseInt(process.env.IMAP_PORT) || 993,
//     tls: true,
//     tlsOptions: { rejectUnauthorized: false }
//   }
// };

// // Middleware
// app.use(cors());
// app.use(helmet());
// app.use(express.json());
// app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// // Test route
// app.get('/', (req, res) => {
//   res.send('🟢 Backend is running with environment variables');
// });

// // Real checkForResponses function (now as an endpoint)
// app.get('/check-responses', async (req, res) => {
//   const { userId, emailId, jobId } = req.query;

//   console.log('🔍 Checking responses with:', { userId, emailId, jobId });

//   if (!userId) {
//     return res.status(400).json({ error: 'userId is required' });
//   }

//   let connection;
//   let mongoClient;

//   try {
//     console.log(`Starting response check for user: ${userId}`);

//     // Connect to IMAP server
//     connection = await imaps.connect(imapConfig);
//     await connection.openBox('INBOX');

//     // Search for unread emails
//     const searchCriteria = ['UNSEEN'];
//     const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };

//     const messages = await connection.search(searchCriteria, fetchOptions);

//     if (messages.length === 0) {
//       console.log('No new responses found.');
//       await connection.end();
//       return res.json({ success: true, responsesFound: 0, message: 'No new responses' });
//     }

//     // Connect to MongoDB
//     mongoClient = new MongoClient(process.env.MONGODB_URI);
//     await mongoClient.connect();
//     const db = mongoClient.db('olukayode_sage');
//     const collection = db.collection('user_application_response');

//     let processedCount = 0;
//     let positiveResponses = 0;
//     let negativeResponses = 0;

//     // Process each email
//     for (const message of messages) {
//       const textPart = message.parts.find(part => part.which === 'TEXT');
//       const id = message.attributes.uid;
//       const rawMessage = textPart?.body;

//       if (!rawMessage) {
//         console.log('No message body found for this email.');
//         continue;
//       }

//       // Parse the email
//       const parsedEmail = await simpleParser(rawMessage);
//       const from = parsedEmail.from?.text || 'Unknown sender';
//       const subject = parsedEmail.subject || 'No subject';
//       const textBody = parsedEmail.text || 'No message body';

//       console.log(`New response from: ${from}`);
//       console.log(`Subject: ${subject}`);

//       // Extract user response from email
//       let normalizedTextBody = textBody.toLowerCase();
//       normalizedTextBody = normalizedTextBody.replace(/<\/?[^>]+(>|$)/g, "");
//       normalizedTextBody = normalizedTextBody.replace(/\s+/g, ' ').trim();

//       const quotedMessageIndex = normalizedTextBody.search(/on .* wrote:/i);
//       let userResponse = quotedMessageIndex !== -1
//         ? normalizedTextBody.slice(0, quotedMessageIndex).trim()
//         : normalizedTextBody;

//       // Check if we have a button response in DB (if emailId and jobId provided)
//       if (emailId && jobId) {
//         try {
//           const buttonResponseRecord = await collection.findOne({
//             userId: userId,
//             jobId: jobId,
//             emailId: emailId
//           });

//           if (buttonResponseRecord && buttonResponseRecord.response) {
//             console.log("✅ Button response retrieved from DB:", buttonResponseRecord.response);
//             userResponse = buttonResponseRecord.response.toLowerCase();
//           }
//         } catch (e) {
//           console.error('Error fetching button response from DB:', e);
//         }
//       }

//       // Determine if response is positive or negative
//       const positiveKeywords = ["proceed", "okay", "yes", "ok", "continue", "thank you", "sure", "please do"];
//       const isPositive = positiveKeywords.some(keyword => userResponse.includes(keyword));

//       if (isPositive) {
//         console.log("✅ Positive response detected:", userResponse);
//         positiveResponses++;
//         // Update application status in database
//         await db.collection('applications').updateOne(
//           { userId, jobId },
//           { $set: { status: 'approved', respondedAt: new Date() } }
//         );
//       } else {
//         console.log("❌ Negative response detected:", userResponse);
//         negativeResponses++;
//         await db.collection('applications').updateOne(
//           { userId, jobId },
//           { $set: { status: 'rejected', respondedAt: new Date() } }
//         );
//       }

//       processedCount++;
//     }

//     await connection.end();
//     await mongoClient.close();

//     console.log(`Processed ${processedCount} responses`);
//     res.json({ 
//       success: true, 
//       responsesFound: messages.length, 
//       processed: processedCount,
//       positiveResponses,
//       negativeResponses
//     });

//   } catch (error) {
//     console.error('Error in checkForResponses:', error);

//     if (connection) {
//       await connection.end();
//     }
//     if (mongoClient) {
//       await mongoClient.close();
//     }

//     res.status(500).json({ error: error.message });
//   }
// });

// // Handle email responses
// app.get('/handle-response', async (req, res) => {
//   const { response, emailId, jobId, userId } = req.query;
//   console.log('📩 Received:', { response, emailId, jobId, userId });

//   try {
//     const client = new MongoClient(process.env.MONGODB_URI);
//     await client.connect();

//     const db = client.db('olukayode_sage');

//     // Store the response
//     const insertResult = await db.collection('user_application_response').insertOne({
//       userId: userId || 'unknown',
//       response,
//       emailId,
//       jobId,
//       timestamp: new Date()
//     });

//     console.log('Response stored in DB:', insertResult.insertedId);

//     // If we have all required parameters, check for responses immediately
//     if (userId && emailId && jobId) {
//       try {
//         const checkResult = await checkForResponsesImmediately(userId, emailId, jobId);
//         console.log('Immediate response check completed:', checkResult);
//       } catch (error) {
//         console.error('Error in immediate response check:', error);
//       }
//     }

//     await client.close();

//     // Send the HTML response
//     res.send(`
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8" />
//         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//         <title>Success</title>
//         <style>
//           body {
//             font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//             display: flex;
//             justify-content: center;
//             align-items: center;
//             height: 100vh;
//             background: linear-gradient(135deg, #f4fdf6 0%, #e8f5e9 100%);
//             margin: 0;
//           }
//           .container {
//             text-align: center;
//             animation: fadeIn 1s ease-in-out;
//             max-width: 400px;
//             padding: 30px;
//             background: white;
//             border-radius: 20px;
//             box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
//           }
//           .circle {
//             width: 130px;
//             height: 130px;
//             background: #a3e635;
//             border-radius: 50%;
//             display: flex;
//             justify-content: center;
//             align-items: center;
//             margin: 0 auto 25px;
//             animation: pop 0.6s ease forwards;
//             box-shadow: 0 5px 15px rgba(163, 230, 53, 0.4);
//           }
//           .tick {
//             font-size: 60px;
//             color: white;
//             animation: scaleUp 0.5s ease forwards 0.5s;
//             opacity: 0;
//           }
//           h1 {
//             font-size: 1.9rem;
//             color: #166534;
//             margin-bottom: 15px;
//           }
//           p {
//             font-size: 1.05rem;
//             color: #4b5563;
//             margin-bottom: 30px;
//             line-height: 1.5;
//           }
//           .button-row {
//             display: flex;
//             justify-content: center;
//             gap: 15px;
//             margin-bottom: 25px;
//           }
//           .btn {
//             padding: 14px 25px;
//             border-radius: 30px;
//             border: none;
//             cursor: pointer;
//             font-size: 1rem;
//             font-weight: 600;
//             transition: all 0.3s ease;
//             min-width: 160px;
//           }
//           .btn:hover {
//             transform: translateY(-3px);
//             box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
//           }
//           .btn:active {
//             transform: translateY(0);
//           }
//           .btn-green {
//             background: #22c55e;
//             color: white;
//           }
//           .btn-green:hover {
//             background: #16a34a;
//           }
//           .btn-purple {
//             background: #6b21a8;
//             color: white;
//           }
//           .btn-purple:hover {
//             background: #581c87;
//           }
//           .footer {
//             margin-top: 30px;
//             font-size: 0.85rem;
//             color: #6b7280;
//           }
//           @keyframes fadeIn {
//             from { opacity: 0; transform: translateY(20px); }
//             to { opacity: 1; transform: translateY(0); }
//           }
//           @keyframes pop {
//             0% { transform: scale(0.5); opacity: 0; }
//             100% { transform: scale(1); opacity: 1; }
//           }
//           @keyframes scaleUp {
//             to { transform: scale(1.1); opacity: 1; }
//           }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="circle">
//             <div class="tick">✔</div>
//           </div>
//           <h1>Excellent Choice!</h1>
//           <p>We've received your response and will now proceed with your application.</p>
//           <div class="button-row">
//             <button class="btn btn-green" onclick="window.location.href='/dashboard/settings'">
//               Auto-Apply
//             </button>
//             <button class="btn btn-purple" onclick="window.close()">
//               Exit
//             </button>
//           </div>
//           <div class="footer">
//             Powered by <strong>IntelliJob</strong> from Suntrenia
//           </div>
//         </div>
//         <script>
//           setTimeout(() => {
//             document.querySelector('.tick').style.opacity = '1';
//           }, 600);
//         </script>
//       </body>
//       </html>
//     `);

//   } catch (err) {
//     console.error('❌ Error in handle-response:', err);
//     res.status(500).send('Server error');
//   }
// });

// // Helper function for immediate checking (used by handle-response)
// async function checkForResponsesImmediately(userId, emailId, jobId) {
//   try {
//     const client = new MongoClient(process.env.MONGODB_URI);
//     await client.connect();

//     const db = client.db('olukayode_sage');
//     const collection = db.collection('user_application_response');

//     // Check for button response in DB
//     const buttonResponseRecord = await collection.findOne({
//       userId: userId,
//       jobId: jobId,
//       emailId: emailId
//     });

//     if (buttonResponseRecord && buttonResponseRecord.response) {
//       console.log("✅ Button response found:", buttonResponseRecord.response);
//       const userResponse = buttonResponseRecord.response.toLowerCase();

//       // Determine if response is positive or negative
//       const positiveKeywords = ["proceed", "okay", "yes", "ok", "continue", "thank you", "sure", "please do"];
//       const isPositive = positiveKeywords.some(keyword => userResponse.includes(keyword));

//       if (isPositive) {
//         console.log("✅ Positive response detected - proceeding with application");
//         // Update application status in database
//         await db.collection('applications').updateOne(
//           { userId, jobId },
//           { $set: { status: 'approved', respondedAt: new Date() } }
//         );
//       } else {
//         console.log("❌ Negative response detected - stopping application");
//         await db.collection('applications').updateOne(
//           { userId, jobId },
//           { $set: { status: 'rejected', respondedAt: new Date() } }
//         );
//       }
//     }

//     await client.close();
//     return { success: true };

////////HEAD
//   } catch (error) {
//     console.error('Error in immediate check:', error);
//     throw error;
//   }
// }

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
//   console.log(`📧 IMAP User: ${process.env.IMAP_USER}`);
//   console.log(`📧 SMTP User: ${process.env.SMTP_USER}`);
// });


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



// const express = require('express');
// const { MongoClient, ObjectId } = require('mongodb');
// const dotenv = require('dotenv').config();
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// const imaps = require('imap-simple');
// const { simpleParser } = require('mailparser');
// const nodemailer = require('nodemailer');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // SMTP Configuration for SENDING emails
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST || "smtp.gmail.com",
//   port: parseInt(process.env.SMTP_PORT) || 587,
//   secure: process.env.SMTP_SECURE === "true",
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASSWORD,
//   },
// });

// // IMAP Configuration for READING emails
// const imapConfig = {
//   imap: {
//     user: process.env.IMAP_USER,
//     password: process.env.IMAP_PASSWORD,
//     host: process.env.IMAP_HOST || "imap.gmail.com",
//     port: parseInt(process.env.IMAP_PORT) || 993,
//     tls: true,
//     tlsOptions: { rejectUnauthorized: false }
//   }
// };

// // Middleware
// app.use(cors());
// app.use(helmet());
// app.use(express.json());
// app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// // Test route
// app.get('/', (req, res) => {
//   res.send('🟢 Backend is running with environment variables');
// });

// // Real checkForResponses function (now as an endpoint)
// app.get('/check-responses', async (req, res) => {
//   const { userId, emailId, jobId } = req.query;

//   console.log('🔍 Checking responses with:', { userId, emailId, jobId });

//   if (!userId) {
//     return res.status(400).json({ error: 'userId is required' });
//   }

//   let connection;
//   let mongoClient;

//   try {
//     console.log(`Starting response check for user: ${userId}`);

//     // Connect to IMAP server
//     connection = await imaps.connect(imapConfig);
//     await connection.openBox('INBOX');

//     // Search for unread emails
//     const searchCriteria = ['UNSEEN'];
//     const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };

//     const messages = await connection.search(searchCriteria, fetchOptions);

//     if (messages.length === 0) {
//       console.log('No new responses found.');
//       await connection.end();
//       return res.json({ success: true, responsesFound: 0, message: 'No new responses' });
//     }

//     // Connect to MongoDB
//     mongoClient = new MongoClient(process.env.MONGODB_URI);
//     await mongoClient.connect();
//     const db = mongoClient.db('olukayode_sage');
//     const collection = db.collection('user_application_response');

//     let processedCount = 0;
//     let positiveResponses = 0;
//     let negativeResponses = 0;

//     // Process each email
//     for (const message of messages) {
//       const textPart = message.parts.find(part => part.which === 'TEXT');
//       const id = message.attributes.uid;
//       const rawMessage = textPart?.body;

//       if (!rawMessage) {
//         console.log('No message body found for this email.');
//         continue;
//       }

//       // Parse the email
//       const parsedEmail = await simpleParser(rawMessage);
//       const from = parsedEmail.from?.text || 'Unknown sender';
//       const subject = parsedEmail.subject || 'No subject';
//       const textBody = parsedEmail.text || 'No message body';

//       console.log(`New response from: ${from}`);
//       console.log(`Subject: ${subject}`);

//       // Extract user response from email
//       let normalizedTextBody = textBody.toLowerCase();
//       normalizedTextBody = normalizedTextBody.replace(/<\/?[^>]+(>|$)/g, "");
//       normalizedTextBody = normalizedTextBody.replace(/\s+/g, ' ').trim();

//       const quotedMessageIndex = normalizedTextBody.search(/on .* wrote:/i);
//       let userResponse = quotedMessageIndex !== -1
//         ? normalizedTextBody.slice(0, quotedMessageIndex).trim()
//         : normalizedTextBody;

//       // Check if we have a button response in DB (if emailId and jobId provided)
//       if (emailId && jobId) {
//         try {
//           const buttonResponseRecord = await collection.findOne({
//             userId: userId,
//             jobId: jobId,
//             emailId: emailId
//           });

//           if (buttonResponseRecord && buttonResponseRecord.response) {
//             console.log("✅ Button response retrieved from DB:", buttonResponseRecord.response);
//             userResponse = buttonResponseRecord.response.toLowerCase();
//           }
//         } catch (e) {
//           console.error('Error fetching button response from DB:', e);
//         }
//       }

//       // Determine if response is positive or negative
//       const positiveKeywords = ["proceed", "okay", "yes", "ok", "continue", "thank you", "sure", "please do"];
//       const isPositive = positiveKeywords.some(keyword => userResponse.includes(keyword));

//       if (isPositive) {
//         console.log("✅ Positive response detected:", userResponse);
//         positiveResponses++;
//         // Update application status in database
//         await db.collection('applications').updateOne(
//           { userId, jobId },
//           { $set: { status: 'approved', respondedAt: new Date() } }
//         );
//       } else {
//         console.log("❌ Negative response detected:", userResponse);
//         negativeResponses++;
//         await db.collection('applications').updateOne(
//           { userId, jobId },
//           { $set: { status: 'rejected', respondedAt: new Date() } }
//         );
//       }

//       processedCount++;
//     }

//     await connection.end();
//     await mongoClient.close();

//     console.log(`Processed ${processedCount} responses`);
//     res.json({ 
//       success: true, 
//       responsesFound: messages.length, 
//       processed: processedCount,
//       positiveResponses,
//       negativeResponses
//     });

//   } catch (error) {
//     console.error('Error in checkForResponses:', error);

//     if (connection) {
//       await connection.end();
//     }
//     if (mongoClient) {
//       await mongoClient.close();
//     }

//     res.status(500).json({ error: error.message });
//   }
// });

// // Handle email responses
// app.get('/handle-response', async (req, res) => {
//   const { response, emailId, jobId, userId } = req.query;
//   console.log('📩 Received:', { response, emailId, jobId, userId });

//   try {
//     const client = new MongoClient(process.env.MONGODB_URI);
//     await client.connect();

//     const db = client.db('olukayode_sage');

//     // Store the response
//     const insertResult = await db.collection('user_application_response').insertOne({
//       userId: userId || 'unknown',
//       response,
//       emailId,
//       jobId,
//       timestamp: new Date()
//     });

//     console.log('Response stored in DB:', insertResult.insertedId);

//     // If we have all required parameters, check for responses immediately
//     if (userId && emailId && jobId) {
//       try {
//         const checkResult = await checkForResponsesImmediately(userId, emailId, jobId);
//         console.log('Immediate response check completed:', checkResult);
//       } catch (error) {
//         console.error('Error in immediate response check:', error);
//       }
//     }

//     await client.close();

//     // Send the HTML response
//     res.send(`
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8" />
//         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//         <title>Success</title>
//         <style>
//           body {
//             font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//             display: flex;
//             justify-content: center;
//             align-items: center;
//             height: 100vh;
//             background: linear-gradient(135deg, #f4fdf6 0%, #e8f5e9 100%);
//             margin: 0;
//           }
//           .container {
//             text-align: center;
//             animation: fadeIn 1s ease-in-out;
//             max-width: 400px;
//             padding: 30px;
//             background: white;
//             border-radius: 20px;
//             box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
//           }
//           .circle {
//             width: 130px;
//             height: 130px;
//             background: #a3e635;
//             border-radius: 50%;
//             display: flex;
//             justify-content: center;
//             align-items: center;
//             margin: 0 auto 25px;
//             animation: pop 0.6s ease forwards;
//             box-shadow: 0 5px 15px rgba(163, 230, 53, 0.4);
//           }
//           .tick {
//             font-size: 60px;
//             color: white;
//             animation: scaleUp 0.5s ease forwards 0.5s;
//             opacity: 0;
//           }
//           h1 {
//             font-size: 1.9rem;
//             color: #166534;
//             margin-bottom: 15px;
//           }
//           p {
//             font-size: 1.05rem;
//             color: #4b5563;
//             margin-bottom: 30px;
//             line-height: 1.5;
//           }
//           .button-row {
//             display: flex;
//             justify-content: center;
//             gap: 15px;
//             margin-bottom: 25px;
//           }
//           .btn {
//             padding: 14px 25px;
//             border-radius: 30px;
//             border: none;
//             cursor: pointer;
//             font-size: 1rem;
//             font-weight: 600;
//             transition: all 0.3s ease;
//             min-width: 160px;
//           }
//           .btn:hover {
//             transform: translateY(-3px);
//             box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
//           }
//           .btn:active {
//             transform: translateY(0);
//           }
//           .btn-green {
//             background: #22c55e;
//             color: white;
//           }
//           .btn-green:hover {
//             background: #16a34a;
//           }
//           .btn-purple {
//             background: #6b21a8;
//             color: white;
//           }
//           .btn-purple:hover {
//             background: #581c87;
//           }
//           .footer {
//             margin-top: 30px;
//             font-size: 0.85rem;
//             color: #6b7280;
//           }
//           @keyframes fadeIn {
//             from { opacity: 0; transform: translateY(20px); }
//             to { opacity: 1; transform: translateY(0); }
//           }
//           @keyframes pop {
//             0% { transform: scale(0.5); opacity: 0; }
//             100% { transform: scale(1); opacity: 1; }
//           }
//           @keyframes scaleUp {
//             to { transform: scale(1.1); opacity: 1; }
//           }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="circle">
//             <div class="tick">✔</div>
//           </div>
//           <h1>Excellent Choice!</h1>
//           <p>We've received your response and will now proceed with your application.</p>
//           <div class="button-row">
//             <button class="btn btn-green" onclick="window.location.href='/dashboard/settings'">
//               Auto-Apply
//             </button>
//             <button class="btn btn-purple" onclick="window.close()">
//               Exit
//             </button>
//           </div>
//           <div class="footer">
//             Powered by <strong>IntelliJob</strong> from Suntrenia
//           </div>
//         </div>
//         <script>
//           setTimeout(() => {
//             document.querySelector('.tick').style.opacity = '1';
//           }, 600);
//         </script>
//       </body>
//       </html>
//     `);

//   } catch (err) {
//     console.error('❌ Error in handle-response:', err);
//     res.status(500).send('Server error');
//   }
// });

// // Helper function for immediate checking (used by handle-response)
// async function checkForResponsesImmediately(userId, emailId, jobId) {
//   try {
//     const client = new MongoClient(process.env.MONGODB_URI);
//     await client.connect();

//     const db = client.db('olukayode_sage');
//     const collection = db.collection('user_application_response');

//     // Check for button response in DB
//     const buttonResponseRecord = await collection.findOne({
//       userId: userId,
//       jobId: jobId,
//       emailId: emailId
//     });

//     if (buttonResponseRecord && buttonResponseRecord.response) {
//       console.log("✅ Button response found:", buttonResponseRecord.response);
//       const userResponse = buttonResponseRecord.response.toLowerCase();

//       // Determine if response is positive or negative
//       const positiveKeywords = ["proceed", "okay", "yes", "ok", "continue", "thank you", "sure", "please do"];
//       const isPositive = positiveKeywords.some(keyword => userResponse.includes(keyword));

//       if (isPositive) {
//         console.log("✅ Positive response detected - proceeding with application");
//         // Update application status in database
//         await db.collection('applications').updateOne(
//           { userId, jobId },
//           { $set: { status: 'approved', respondedAt: new Date() } }
//         );
//       } else {
//         console.log("❌ Negative response detected - stopping application");
//         await db.collection('applications').updateOne(
//           { userId, jobId },
//           { $set: { status: 'rejected', respondedAt: new Date() } }
//         );
//       }
//     }

//     await client.close();
//     return { success: true };

// =======
// >>>>>>> 855ac8093dcbb600833ba18405db511b76bf58e5
//   } catch (error) {
//     console.error('Error in immediate check:', error);
//     throw error;
//   }
// }

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
//   console.log(`📧 IMAP User: ${process.env.IMAP_USER}`);
//   console.log(`📧 SMTP User: ${process.env.SMTP_USER}`);
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
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:5173'
    ],
    methods: ['GET', 'POST']
  }
});


io.on('connection', (socket) => {
  console.log('🔌 WebSocket client connected:', socket.id);
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
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////
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

        // ... rest of your existing processing code ...
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

// Enhanced handle-response with debugging - NOW SAVES ALL PARAMETERS
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
    try {
      const checkResult = await checkForResponsesImmediately(trimmedUserId, trimmedEmailId, trimmedJobId);
      console.log('✅ Immediate check completed:', checkResult);

      // Update the record as processed
      await db.collection('user_application_response').updateOne(
        { _id: insertResult.insertedId },
        { $set: { processed: true, processedAt: new Date() } }
      );
      console.log('✅ Response marked as processed');

      // 🔥 WEB SOCKET NOTIFICATION: Notify frontend that data is ready
      io.emit('dataReady', {
        userId: trimmedUserId,
        jobId: trimmedJobId,
        emailId: trimmedEmailId,
        responseId: insertResult.insertedId,
        message: 'Application response processed and data is ready for retrieval',
        timestamp: new Date().toISOString()
      });
      console.log('📢 WebSocket notification sent to frontend');

    } catch (checkError) {
      console.error('❌ Error in immediate response check:', checkError);
      // Don't fail the request, just log the error
    }

    await mongoClient.close();
    console.log('✅ MongoDB connection closed');

    // Send success response
    console.log('📤 Sending HTML response to client');
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
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      margin: 0;
      padding: 20px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .container {
      max-width: 500px;
      margin: 50px auto;
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      text-align: center;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .circle {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      border-radius: 50%;
      margin: 0 auto 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 32px rgba(34, 197, 94, 0.25);
      position: relative;
      animation: scaleIn 0.6s ease-out 0.3s both;
    }

    .circle::before {
      content: '';
      position: absolute;
      inset: -3px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      border-radius: 50%;
      z-index: -1;
      opacity: 0.3;
      animation: pulse 2s ease-in-out 1s infinite;
    }

    @keyframes scaleIn {
      from { transform: scale(0); }
      to { transform: scale(1); }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.3; }
      50% { transform: scale(1.05); opacity: 0.6; }
    }

    .tick {
      color: white;
      font-size: 36px;
      font-weight: 600;
      opacity: 0;
      transition: opacity 0.5s ease 0.8s;
    }

    h1 {
      color: #1f2937;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 15px;
    }

    p {
      color: #6b7280;
      font-size: 16px;
      margin-bottom: 20px;
      line-height: 1.5;
    }

    .button-row {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin: 30px 0;
    }

    .btn {
      padding: 14px 28px;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      font-size: 15px;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      transition: left 0.6s;
    }

    .btn:hover::before {
      left: 100%;
    }

    .btn-green {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
    }

    .btn-green:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
    }

    .btn-purple {
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    }

    .btn-purple:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
    }

    .footer {
      margin-top: 30px;
      color: #9ca3af;
      font-size: 14px;
    }

    /* Responsive design */
    @media (max-width: 480px) {
      .container {
        margin: 20px;
        padding: 32px 24px;
      }
      
      .button-row {
        flex-direction: column;
        gap: 12px;
      }
      
      .btn {
        width: 100%;
      }
      
      h1 {
        font-size: 24px;
      }
    }

    .exit-message {
      display: none;
      text-align: center;
      padding: 50px;
      font-family: sans-serif;
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
    
    // Animate tick appearance
    setTimeout(() => {
      document.querySelector('.tick').style.opacity = '1';
    }, 800);
    
    // Exit function
    function exitPage() {
      // Hide main container
      document.querySelector('.container').style.display = 'none';
      
      // Show exit message
      document.querySelector('.exit-message').style.display = 'block';
      
      // Try different exit methods
      setTimeout(() => {
        try {
          // Method 1: Try to close window
          window.close();
        } catch (e) {
          console.log('Cannot close window');
        }
        
        // Method 2: Try history back
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
    
    // Add button interaction feedback
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', function() {
        this.style.transform = 'scale(0.95) translateY(-1px)';
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
    console.error('❌ CRITICAL ERROR in handle-response:', err);
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
