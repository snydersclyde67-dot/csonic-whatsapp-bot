const express = require('express');
const messageController = require('../controllers/messageController');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token && mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    logger('Webhook verified');
    return res.status(200).send(challenge);
  }

  res.status(403).send('Forbidden');
});

router.post('/', async (req, res) => {
  try {
    await messageController.handleIncomingMessage(req.body);
    res.sendStatus(200);
  } catch (error) {
    logger('Error handling webhook POST', error.message || error);
    res.sendStatus(500);
  }
});

module.exports = router;

