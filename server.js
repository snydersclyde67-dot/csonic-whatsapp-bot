const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const logger = require('./utils/logger');

dotenv.config();

require('./database/db');

const whatsappRouter = require('./routes/whatsapp');
const businessRouter = require('./routes/business');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/webhook', whatsappRouter);
app.use('/api', businessRouter);

app.use('/admin', express.static(path.join(__dirname, 'dashboard')));
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
});

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

