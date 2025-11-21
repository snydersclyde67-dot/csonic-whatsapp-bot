const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token && mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('Webhook verified');
    return res.status(200).send(challenge);
  }

  return res.status(403).send('Forbidden');
});

const sendMessage = async (to, text) => {
  await axios.post(
    `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
    },
  );
};

app.post('/webhook', (req, res) => {
  console.log('Webhook received');

  const body = req.body;
  console.log('Incoming webhook body:', JSON.stringify(body, null, 2));

  if (
    body.object &&
    body.entry &&
    body.entry[0].changes &&
    body.entry[0].changes[0].value &&
    body.entry[0].changes[0].value.messages &&
    body.entry[0].changes[0].value.messages[0]
  ) {
    const message = body.entry[0].changes[0].value.messages[0];
    const from = message.from;
    const text = message.text?.body;

    console.log('User number:', from);
    console.log('User message:', text);

    sendMessage(from, `You said: ${text}`);
  } else {
    console.log('No valid message found in webhook');
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

