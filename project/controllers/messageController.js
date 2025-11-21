const whatsappService = require('../services/whatsappService');
const logger = require('../utils/logger');

const extractMessage = (payload) => {
  if (
    !payload ||
    !payload.entry ||
    !Array.isArray(payload.entry) ||
    !payload.entry[0].changes ||
    !payload.entry[0].changes[0].value ||
    !payload.entry[0].changes[0].value.messages
  ) {
    return null;
  }

  const change = payload.entry[0].changes[0];
  const message = change.value.messages[0];
  const from = message.from;
  const text = message.text && message.text.body ? message.text.body : '';

  return { from, text };
};

const handleIncomingMessage = async (payload) => {
  const incoming = extractMessage(payload);

  if (!incoming) {
    logger('Webhook POST received with no message payload');
    return;
  }

  logger(`Incoming message from ${incoming.from}: ${incoming.text}`);

  const reply = `Hi! Your message was received: ${incoming.text}`;
  await whatsappService.sendMessage(incoming.from, reply);
};

module.exports = {
  handleIncomingMessage,
};

