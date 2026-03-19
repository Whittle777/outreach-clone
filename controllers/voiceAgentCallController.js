// controllers/voiceAgentCallController.js

const VoiceAgentCall = require('../models/VoiceAgentCall');

exports.getVoiceAgentCalls = async (req, res) => {
  try {
    const calls = await VoiceAgentCall.getAll();
    res.json(calls);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch voice agent calls' });
  }
};
