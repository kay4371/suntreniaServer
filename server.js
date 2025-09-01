

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
    await client.connect();
    
    const db = client.db('olukayode_sage');
    // ✅ Store the insert result in a variable
    const insertResult = await db.collection('user_application_response').insertOne({
      response,
      emailId,
      jobId,
      timestamp: new Date()
    });
    
    console.log('Insert result:', insertResult);
    console.log("Checking for responses now...");
    
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

    await client.close();

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
            background: #f4fdf6;
            margin: 0;
          }
          .container {
            text-align: center;
            animation: fadeIn 1s ease-in-out;
          }
          .circle {
            width: 100px;
            height: 100px;
            background: #a3e635;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0 auto 20px;
            animation: pop 0.6s ease forwards;
          }
          .tick {
            font-size: 48px;
            color: white;
            animation: scaleUp 0.5s ease forwards 0.5s;
            opacity: 0;
          }
          h1 {
            font-size: 1.8rem;
            color: #166534;
            margin-bottom: 10px;
          }
          p {
            font-size: 1rem;
            color: #4b5563;
            margin-bottom: 20px;
          }
          .btn {
            background: #22c55e;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            border: none;
            cursor: pointer;
            font-size: 0.95rem;
            transition: background 0.3s ease;
          }
          .btn:hover {
            background: #16a34a;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
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
          <h1>Good Choice</h1>
          <p>We'll now proceed with your application.</p>
          <button class="btn" onclick="alert('Auto-Apply enabled! Next time, we'll handle it for you ✨')">
            Enable Auto Apply
          </button>
        </div>
        <script>
          // Reveal tick after circle pops
          setTimeout(() => {
            document.querySelector('.tick').style.opacity = '1';
          }, 600);
        </script>
      </body>
      </html>
    `);

  } catch (err) {
    console.error('❌ MongoDB Error:', err);
    res.status(500).send('Database error');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

