const express = require('express');
const MCPGateway = require('../services/mcpGateway');
const config = require("../config/index");

const router = express.Router();
const mcpGateway = new MCPGateway(config.getConfig().mcpGateway.apiUrl, config.getConfig().mcpGateway.apiKey);

router.post('/send', async (req, res) => {
  const result = await mcpGateway.sendData(req.body);
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json(result);
  }
});

router.get('/receive', async (req, res) => {
  const result = await mcpGateway.receiveData();
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json(result);
  }
});

module.exports = router;
