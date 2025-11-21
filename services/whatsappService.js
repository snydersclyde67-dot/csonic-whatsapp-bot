const axios = require('axios');
const logger = require('../utils/logger');
const whatsappConfig = require('../config/whatsapp');

const BASE_URL = `${whatsappConfig.graphBaseUrl}/${whatsappConfig.apiVersion}`;

const sendMessage = async (to, text) => {
  const token = whatsappConfig.token;
  const phoneNumberId = whatsappConfig.phoneNumberId;

  if (!token || !phoneNumberId) {
    throw new Error('Missing WhatsApp credentials');
  }

  const url = `${BASE_URL}/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text },
  };

  try {
    await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    logger(`Reply sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger('Failed to send WhatsApp message', error.response?.data || error.message);
    throw error;
  }
};

const sendInteractiveMessage = async (to, bodyText, buttons) => {
  if (!Array.isArray(buttons) || buttons.length === 0) {
    throw new Error('Buttons array is required for interactive messages');
  }

  const trimmedButtons = buttons.slice(0, 3).map((btn, index) => ({
    type: 'reply',
    reply: {
      id: btn.id || `btn_${index + 1}`,
      title: btn.title?.slice(0, 20) || `Option ${index + 1}`,
    },
  }));

  const token = whatsappConfig.token;
  const phoneNumberId = whatsappConfig.phoneNumberId;

  if (!token || !phoneNumberId) {
    throw new Error('Missing WhatsApp credentials');
  }

  const url = `${BASE_URL}/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: { buttons: trimmedButtons },
    },
  };

  try {
    await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    logger(`Interactive reply sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger('Failed to send interactive WhatsApp message', error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  sendMessage,
  sendInteractiveMessage,
};

