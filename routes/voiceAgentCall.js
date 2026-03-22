const express = require('express');
const router = express.Router();
const VoiceAgentCall = require('../services/voiceAgentCall');
const { callRateLimiting, timeBlockMiddleware } = require('../middleware/callRateLimiting');

const voiceAgentCallService = new VoiceAgentCall(config.azureApiKey);

router.post('/initiate', [callRateLimiting, timeBlockMiddleware], async (req, res) => {
  try {
    const callData = req.body;
    await voiceAgentCallService.initiateCall(callData);
    res.status(200).json({ message: 'Call initiated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
