/**
 * WhatsApp Cloud API Webhook Server
 * ---------------------------------
 * Minimal Express server with GET/POST /webhook endpoints
 * ready for deployment to Render (or any Node hosting).
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = 'csonic123';

app.use(cors());
app.use(bodyParser.json());

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'WhatsApp Cloud API Webhook is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    return res.status(200).send(challenge);
  }

  console.warn('❌ Webhook verification failed');
  return res.sendStatus(403);
});

app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object !== 'whatsapp_business_account') {
    console.warn('⚠️ Received non-WhatsApp payload');
    return res.sendStatus(404);
  }

  const entries = body.entry ?? [];
  entries.forEach((entry) => {
    const changes = entry.changes ?? [];
    changes.forEach((change) => {
      const value = change.value ?? {};

      if (Array.isArray(value.messages)) {
        value.messages.forEach((message) => {
          const from = message.from;
          const text = message.text?.body;
          const type = message.type;
          console.log('📨 Incoming WhatsApp message', {
            from,
            type,
            text
          });
        });
      }

      if (Array.isArray(value.statuses)) {
        value.statuses.forEach((status) => {
          console.log('📊 Message status update', {
            id: status.id,
            status: status.status,
            timestamp: status.timestamp
          });
        });
      }
    });
  });

  return res.sendStatus(200);
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

app.listen(PORT, () => {
  console.log(`🚀 WhatsApp webhook server running on port ${PORT}`);
});

