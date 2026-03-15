const express = require('express');
const webhookService = require('../services/webhook');

const router = express.Router();

router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body;
    await webhookService.handleWebhookPayload(payload);
    res.status(200).send('Webhook received and processed');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});

module.exports = router;
