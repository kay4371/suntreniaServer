const express = require('express');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv').config();
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session'); // Add session middleware

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB URI - Make sure this is in your .env file
const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
}

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
}));

// Global error handlers
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Test route
app.get('/', (req, res) => {
    res.send('🟢 Backend is running (CommonJS)');
});

// Handle email responses
app.get('/handle-response', async (req, res) => {
    let client;
    
    try {
        // Input validation
        const { response, emailId, jobId } = req.query;
        
        console.log('Received query parameters:', { response, emailId, jobId });
        
        // Validate required parameters
        if (!response || !['proceed', 'decline'].includes(response)) {
            console.error('Invalid request: Missing or invalid response.');
            return res.status(400).send('Invalid request: Missing or invalid response.');
        }
        
        if (!emailId) {
            console.error('Invalid request: Missing emailId.');
            return res.status(400).send('Invalid request: Missing emailId.');
        }
        
        // Connect to MongoDB
        client = new MongoClient(uri, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true 
        });
        
        await client.connect();
        console.log('Connected to database');
        
        const database = client.db('olukayode_sage');
        const collection = database.collection('user_application_response');
        
        // Map button responses
        const typedResponse = response === 'proceed' ? 'okay' : 'not interested';
        
        // Generate data
        const timestamp = new Date();
        const userId = req.session?.userId || 'default_user_id';
        
        console.log('Generated data:', { emailId, timestamp, userId, jobId });
        
        // Save response to MongoDB
        const insertResult = await collection.insertOne({
            emailId,
            userId,
            response: typedResponse,
            timestamp,
            jobId: jobId || null, // Handle optional jobId
        });
        
        console.log('Insert result:', insertResult);
        console.log("Checking for responses now...");
        
        // Check for responses - with proper error handling
        try {
            if (typeof checkForResponses === 'function') {
                await checkForResponses(userId, emailId, jobId);
            } else {
                console.log('checkForResponses function not available in this environment');
            }
        } catch (error) {
            console.error('Error in checkForResponses:', error);
            // Don't fail the request if this optional function fails
        }
        
        // Redirect to acknowledgement page
        res.redirect(`https://suntrenia.com/acknowledgement?response=${response}`);
        
    } catch (error) {
        console.error('Error handling response:', error);
        res.status(500).send('An error occurred while processing your response.');
    } finally {
        if (client) {
            try {
                await client.close();
                console.log('Database connection closed');
            } catch (closeError) {
                console.error('Error closing database connection:', closeError);
            }
        }
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Express error handler:', error);
    res.status(500).send('Internal server error');
});

// 404 handler
app.use((req, res) => {
    res.status(404).send('Route not found');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}).on('error', (error) => {
    console.error('Server failed to start:', error);
    process.exit(1);
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
