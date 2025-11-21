const router = require('../core/router');
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

  return { from, text, buttonId };
};

const handleIncomingMessage = async (payload) => {
  const incoming = extractMessage(payload);

  if (!incoming) {
    logger('Webhook POST received with no message payload');
    return;
  }

  logger(`Incoming message from ${incoming.from}: ${incoming.text}`);
  await router.handleIncomingPayload(incoming);
};

module.exports = {
  handleIncomingMessage,
};

