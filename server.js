

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
  const { response, emailId, jobId } = req.query;
  console.log('📩 Received:', { response, emailId, jobId });
 
  try {
   
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect()
    
    const db = client.db('olukayode_sage');
    await db.collection('user_application_response').insertOne({
      response,
      emailId,
      jobId,
      timestamp: new Date()
    });
    await client.close();


    console.log('Insert result:', insertResult);
    console.log("Checking for responses now...")
    
    // [ADDED] Check for responses - only if function exists
    try {
      if (typeof checkForResponses === 'function') {
        // Use emailId and jobId from query, generate userId fallback
        const userId = 'default_user_id'; // Simplified like local version approach
        await checkForResponses(userId, emailId, jobId);
      } else {
        console.log('checkForResponses function not available in this environment');
      }
    } catch (error) {
      console.error('Error in checkForResponses:', error);
    }


    res.send(`
      <h1>✅ Success!</h1>
      <p>Recorded: ${response} (job ${jobId})</p>
    `);
  } catch (err) {
    console.error('❌ MongoDB Error:', err);
    res.status(500).send('Database error');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

