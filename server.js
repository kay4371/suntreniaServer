const express = require('express');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv').config();
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Test route
app.get('/', (req, res) => {
res.send('🟢 Backend is running (CommonJS)');
});

// Handle email responses
app.get('/handle-response', async (req, res) => {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  
  try {
      await client.connect();
      console.log('Connected to database');
      const database = client.db('olukayode_sage');
      const collection = database.collection('user_application_response');

      const { response } = req.query;
      console.log('Received query parameters:', { response });

      // Validate the response
      if (!response || !['proceed', 'decline'].includes(response)) {
          console.error('Invalid request: Missing or invalid response.');
          return res.status(400).send('Invalid request: Missing or invalid response.');
      }

      // Map button responses
      const typedResponse = response === 'proceed' ? 'okay' : 'not interested';

      // Generate dynamic data - SIMPLIFIED AND CORRECTED
      const emailId = req.query.emailId; // Get the emailId from the URL (from the email link)
      const timestamp = new Date();
      const userId = req.session?.userId || 'default_user_id';
      const jobId = req.query.jobId; // Get jobId from URL parameters
      console.log('Generated data:', { emailId, timestamp, userId, jobId });

      // Save response to MongoDB
      const insertResult = await collection.insertOne({
          emailId,
          userId,
          response: typedResponse,
          timestamp,
          jobId,
      });

      console.log('Insert result:', insertResult);
      console.log("Checking for responses now...")
      
      // [ADDED] Check for responses - only if function exists
      try {
          if (typeof checkForResponses === 'function') {
              await checkForResponses(userId, emailId, jobId);
          } else {
              console.log('checkForResponses function not available in this environment');
          }
      } catch (error) {
          console.error('Error in checkForResponses:', error);
      }

      // Redirect to acknowledgement page
      res.redirect(`https://suntrenia.com/acknowledgement?response=${response}`);
      
  } catch (error) {
      console.error('Error handling response:', error);
      res.status(500).send('An error occurred while processing your response.');
  } finally {
      await client.close(); // Close the database connection to prevent leaks
  }
});














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
