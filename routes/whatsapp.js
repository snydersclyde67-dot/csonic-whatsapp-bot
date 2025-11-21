/**
 * WhatsApp Webhook Routes
 * Handles incoming WhatsApp messages and webhook verification
 */

const express = require('express');
const router = express.Router();
const { parseMessage } = require('../services/messageParser');
const { getAIResponse, getHelpMessage } = require('../services/aiService');
const { sendWhatsAppMessage, saveMessage } = require('../modules/generic');
const whatsappConfig = require('../config/whatsapp');
const conversationRouter = require('../core/router');
const logger = require('../utils/logger');

/**
 * Webhook verification (GET)
 */
router.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === whatsappConfig.verifyToken) {
        logger('Webhook verified');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

/**
 * Receive WhatsApp messages (POST)
 */
const extractMessagePayload = (body) => {
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
        return null;
    }

    const from = message.from;
    const text =
        message.text?.body ||
        message.button?.text ||
        message.interactive?.button_reply?.title ||
        message.interactive?.list_reply?.title ||
        '';

    const buttonId =
        message.button?.payload ||
        message.button?.text ||
        message.interactive?.button_reply?.id ||
        message.interactive?.list_reply?.id ||
        null;

    return { from, text, buttonId, message, value };
};

router.post('/', async (req, res) => {
    try {
        const body = req.body;

        // Verify it's a WhatsApp message
        if (body.object === 'whatsapp_business_account') {
            const payload = extractMessagePayload(body);

            if (payload) {
                const { from, text, buttonId, value } = payload;
                logger(`Received message from ${from}: ${text}`);

                const parseResult = await parseMessage(from, text);

                if (!parseResult.success) {
                    await sendWhatsAppMessage(from, parseResult.message);
                    return res.sendStatus(200);
                }

                const { business, customer, response, handled } = parseResult;

                await saveMessage(business.id, customer.id, text, 'incoming');

                const routed = await conversationRouter.handleIncomingPayload({
                    from,
                    text,
                    buttonId,
                    business,
                    customer,
                });

                if (routed) {
                    return res.sendStatus(200);
                }

                let replyMessage = null;

                if (handled && response) {
                    replyMessage = response;
                } else {
                    const aiResponse = await getAIResponse(business, customer, text);
                    if (aiResponse) {
                        replyMessage = aiResponse;
                    } else {
                        replyMessage = getHelpMessage(business, customer?.language || business.language || 'en');
                    }
                }

                if (replyMessage) {
                    await sendWhatsAppMessage(from, replyMessage, business.id);
                }

                return res.sendStatus(200);
            }

            // Handle status updates (message delivered, read, etc.)
            const statusEntry = body.entry?.[0]?.changes?.[0]?.value;
            if (statusEntry?.statuses) {
                logger('Message status update', statusEntry.statuses);
                return res.sendStatus(200);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

