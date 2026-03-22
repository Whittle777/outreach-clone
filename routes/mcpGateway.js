// routes/mcpGateway.js

const express = require('express');
const router = express.Router();
const mcpGatewayService = require('../services/mcpGatewayService');

// Example endpoint for demonstration purposes
router.post('/send', async (req, res) => {
  try {
    const message = req.body.message;
    const response = await mcpGatewayService.sendMessage(message);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
