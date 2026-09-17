const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDB, getStatus } = require('./config/db');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Ensure DB is connected for serverless invocations (Vercel)
const mongoose = require('mongoose');
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  next();
});

// Health check and MongoDB status route
app.get('/api/health', (req, res) => {
  const dbStatus = getStatus();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Game & Leaderboard routes
app.use('/api/games', gameRoutes);

// Fallback for API 404
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Connect to MongoDB Atlas and start server locally (if not on Vercel)
if (process.env.VERCEL !== '1') {
  const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  };
  startServer();
}

// Export the Express app for Vercel serverless functions
module.exports = app;
