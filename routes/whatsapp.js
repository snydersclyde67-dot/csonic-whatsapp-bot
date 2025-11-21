/**
 * WhatsApp Webhook Routes
 * Handles incoming WhatsApp messages and webhook verification
 */

const express = require('express');
const router = express.Router();
const { parseMessage } = require('../services/messageParser');
const { getAIResponse } = require('../services/aiService');
const { sendWhatsAppMessage, saveMessage } = require('../modules/generic');
const { listBots } = require('../services/botRegistry');
const whatsappConfig = require('../config/whatsapp');

/**
 * Webhook verification (GET)
 */
router.get('/webhook/whatsapp', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = whatsappConfig.verifyToken;

    if (mode === 'subscribe' && token === verifyToken) {
        console.log('Webhook verified');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

/**
 * Receive WhatsApp messages (POST)
 */
router.post('/webhook/whatsapp', async (req, res) => {
    try {
        const body = req.body;

        // Verify it's a WhatsApp message
        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;

            // Handle messages
            if (value?.messages) {
                const message = value.messages[0];
                const from = message.from;
                const messageText = message.text?.body || '';
                const messageId = message.id;

                console.log(`Received message from ${from}: ${messageText}`);

                // Parse and route message
                const parseResult = await parseMessage(from, messageText);

                if (!parseResult.success) {
                    // Send error message
                    await sendWhatsAppMessage(from, parseResult.message);
                    return res.sendStatus(200);
                }

                const { business, customer, response, handled } = parseResult;

                // Save incoming message
                await saveMessage(business.id, customer.id, messageText, 'incoming');

                let replyMessage = null;

                // If module handled it, use that response
                if (handled && response) {
                    replyMessage = response;
                } else {
                    // Try AI service
                    const aiResponse = await getAIResponse(business, customer, messageText);
                    if (aiResponse) {
                        replyMessage = aiResponse;
                    } else {
                        // Default response
                        const { getHelpMessage } = require('../services/aiService');
                        replyMessage = getHelpMessage(business, customer?.language || business.language || 'en');
                    }
                }

                // Send reply
                if (replyMessage) {
                    await sendWhatsAppMessage(from, replyMessage, business.id);
                }

                return res.sendStatus(200);
            }

            // Handle status updates (message delivered, read, etc.)
            if (value?.statuses) {
                console.log('Message status update:', value.statuses);
                return res.sendStatus(200);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Send message manually (for testing/admin)
 */
router.post('/api/messages/send', async (req, res) => {
    try {
        const { to, message, businessId } = req.body;

        if (!to || !message) {
            return res.status(400).json({ error: 'Missing required fields: to, message' });
        }

        const result = await sendWhatsAppMessage(to, message, businessId || null);

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Send broadcast message
 */
router.post('/api/messages/broadcast', async (req, res) => {
    try {
        const { businessId, message, targetAudience = 'all' } = req.body;

        if (!businessId || !message) {
            return res.status(400).json({ error: 'Missing required fields: businessId, message' });
        }

        const db = require('../database/db');
        
        // Get customers for this business
        let query = `SELECT DISTINCT phone_number FROM customers WHERE business_id = ?`;
        const params = [businessId];

        if (targetAudience !== 'all') {
            // Add filters based on target audience (future enhancement)
            // For now, just use all customers
        }

        const customers = await new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        // Create broadcast record
        const broadcastId = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO broadcasts (business_id, message_text, target_audience, status)
                 VALUES (?, ?, ?, 'sending')`,
                [businessId, message, targetAudience],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        // Send to all customers
        const results = [];
        let sentCount = 0;

        for (const customer of customers) {
            try {
                const result = await sendWhatsAppMessage(customer.phone_number, message, businessId);
                if (result.success) {
                    sentCount++;
                }
                results.push({ to: customer.phone_number, success: result.success });
            } catch (error) {
                console.error(`Error sending to ${customer.phone_number}:`, error);
                results.push({ to: customer.phone_number, success: false, error: error.message });
            }
        }

        // Update broadcast status
        db.run(
            `UPDATE broadcasts SET status = 'sent', sent_count = ? WHERE id = ?`,
            [sentCount, broadcastId],
            () => {}
        );

        res.json({
            success: true,
            broadcastId: broadcastId,
            total: customers.length,
            sent: sentCount,
            results: results
        });
    } catch (error) {
        console.error('Error sending broadcast:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Inspect registered bot modules
 */
router.get('/api/bots', (req, res) => {
    res.json({
        success: true,
        bots: listBots()
    });
});

module.exports = router;

