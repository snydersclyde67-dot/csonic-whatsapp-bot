const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = 'https://graph.facebook.com/v20.0';

const sendMessage = async (to, text) => {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.PHONE_NUMBER_ID;

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
  } catch (error) {
    logger('Failed to send WhatsApp message', error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  sendMessage,
};

