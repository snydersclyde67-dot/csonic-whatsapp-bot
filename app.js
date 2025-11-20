/**
 * CSonic Bot - Main Application
 * WhatsApp Business Bot System for South African Small Businesses
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const cron = require('node-cron');

// Initialize database
require('./database/db');

// Import routes
const whatsappRoutes = require('./routes/whatsapp');
const businessRoutes = require('./routes/business');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (dashboard)
app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));
app.use(express.static(path.join(__dirname, 'dashboard')));

// Routes
app.use('/', whatsappRoutes);
app.use('/', businessRoutes);

// Dashboard route
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'CSonic WhatsApp Business Bot API',
        version: '1.0.0',
        endpoints: {
            webhook: '/webhook/whatsapp',
            dashboard: '/dashboard',
            api: '/api/businesses'
        }
    });
});

// Scheduled tasks
// Send booking reminders at 6 PM daily
cron.schedule('0 18 * * *', async () => {
    console.log('Running scheduled task: Send booking reminders');
    try {
        const { sendTomorrowReminders } = require('./services/bookingService');
        const results = await sendTomorrowReminders();
        console.log(`Sent ${results.filter(r => r.success).length} booking reminders`);
    } catch (error) {
        console.error('Error sending booking reminders:', error);
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 CSonic Bot Server is running!`);
    console.log(`📱 WhatsApp Webhook: http://localhost:${PORT}/webhook/whatsapp`);
    console.log(`📊 Admin Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    console.log(`\n💡 Make sure to configure your .env file with WhatsApp credentials.\n`);
});

module.exports = app;

