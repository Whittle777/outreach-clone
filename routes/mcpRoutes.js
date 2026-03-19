// routes/mcpRoutes.js

const express = require('express');
const router = express.Router();
const mcp = require('../services/mcp');
const axios = require('axios');

// Middleware to parse JSON bodies
router.use(express.json());

// Endpoint to send data to MCP Gateway
router.post('/send', async (req, res) => {
  try {
    const { data, signature } = req.body;

    // Verify the signature
    if (!mcp.verify(data, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process the data (this is a placeholder for actual processing logic)
    console.log('Received and verified data:', data);

    // Example: Forward the data to another service
    const response = await axios.post('http://example-service/endpoint', { data });

    res.status(200).json({ message: 'Data processed successfully', response: response.data });
  } catch (error) {
    console.error('Error processing MCP data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
