
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const webhookRouter = require('./routers/webhookRouter');
const logger = require('./utils/logger');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/webhook', webhookRouter);

app.get('/', (req, res) => {
  res.json({ status: 'CSonic WhatsApp bot is running.' });
});

app.use((err, req, res, next) => {
  logger('Unhandled error', err.message || err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger(`Server listening on port ${PORT}`);
});

