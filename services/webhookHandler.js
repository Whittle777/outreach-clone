const express = require('express');
const bodyParser = require('body-parser');
const { getConfig } = require('../config/index');
const logger = require('../services/logger');

const app = express();
const config = getConfig();

app.use(bodyParser.json());

app.post(config.webhook.path, (req, res) => {
  const payload = req.body;
  logger.log('Received webhook notification', payload);

  // Process the webhook payload here
  // For example, update the database or trigger other services

  res.status(200).send('Webhook received');
});

app.listen(config.webhook.port, () => {
  logger.log(`Webhook server is running on port ${config.webhook.port}`);
});
