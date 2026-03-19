const VoiceAgentCall = require('../models/VoiceAgentCall');

exports.create = async (req, res) => {
  try {
    const { prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, sentimentAnalysis, bento } = req.body;
    const newCall = await VoiceAgentCall.create(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, sentimentAnalysis, bento);
    res.status(201).json(newCall);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const calls = await VoiceAgentCall.getAll();
    res.status(200).json(calls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
