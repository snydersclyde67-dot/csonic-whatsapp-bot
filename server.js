/**
 * CSonic WhatsApp Bot Server
 * Main Express server for handling WhatsApp webhooks and business API
 */

const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

// Initialize database connection
require('./database/db');

// Import routers
const whatsappRouter = require('./routes/whatsapp');
const businessRouter = require('./routes/business');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
// WhatsApp webhook routes (GET for verification, POST for messages)
// Meta webhook expects: GET /webhook?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
// Meta webhook sends: POST /webhook with message payload
app.use('/webhook', whatsappRouter);

// Business management API routes
app.use('/api', businessRouter);

// Admin dashboard (static files)
app.use('/admin', express.static(path.join(__dirname, 'dashboard')));
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'CSonic WhatsApp bot is running.',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger('Unhandled error', err.message || err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, () => {
  logger('='.repeat(50));
  logger('✅ CSonic WhatsApp Bot Server Started Successfully');
  logger(`📍 Server listening on port ${PORT}`);
  logger(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger(`📱 Webhook endpoint: http://localhost:${PORT}/webhook`);
  logger(`🔧 API endpoint: http://localhost:${PORT}/api`);
  logger(`📊 Admin dashboard: http://localhost:${PORT}/admin`);
  logger('='.repeat(50));
});

// Export server and port for testing/deployment
module.exports = { app, server, PORT };

