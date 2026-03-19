const express = require('express');
const azureAcsService = require('../services/azureAcsService');

const router = express.Router();

router.get('/:callId', async (req, res) => {
  const { callId } = req.params;
  try {
    const callFlags = await azureAcsService.getCallFlags(callId);
    res.json(callFlags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
