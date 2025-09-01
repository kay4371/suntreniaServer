
// require('dotenv').config(); // Load .env file
// const express = require('express');
// const mongoose = require('mongoose'); // Use mongoose OR MongoClient, not both

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Database Connection (with error handling)
// async function connectDB() {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log('✅ MongoDB Connected');
//   } catch (err) {
//     console.error('❌ MongoDB Connection Error:', err.message);
//     process.exit(1); // Crash the app if DB fails
//   }
// }

// // Routes
// app.get('/handle-response', async (req, res) => {
//   try {
//     const { response, emailId, jobId } = req.query;
//     console.log('Received:', { response, emailId, jobId });

//     // Save to MongoDB (example with mongoose)
//     const Response = mongoose.model('Response', new mongoose.Schema({
//       response: String,
//       emailId: String,
//       jobId: String,
//       timestamp: { type: Date, default: Date.now }
//     }));

//     await Response.create({ response, emailId, jobId });

//     res.send(`
//       <h1>Thank you!</h1>
//       <p>Your response (${response}) has been recorded.</p>
//     `);
//   } catch (err) {
//     console.error('Error:', err);
//     res.status(500).send('Server Error');
//   }
// });

// // Start Server
// connectDB().then(() => {
//   app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// });





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
    const db = client.db('suntrenia');
    await db.collection('responses').insertOne({
      response,
      emailId,
      jobId,
      timestamp: new Date()
    });
    await client.close();

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
