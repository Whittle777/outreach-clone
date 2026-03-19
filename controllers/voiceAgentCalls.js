const VoiceAgentCall = require('../models/VoiceAgentCall');
const sentimentAnalysis = require('sentiment-analysis'); // Hypothetical library
const axios = require('axios');

const rateLimiterUrl = process.env.RATE_LIMITER_URL || 'http://localhost:8080/rate-limit';

exports.create = async (req, res) => {
  try {
    const { prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, bento } = req.body;

    // Check rate limit
    const response = await axios.get(`${rateLimiterUrl}/${prospectId}`);
    if (!response.data.allowed) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    // Perform sentiment analysis
    const sentiment = sentimentAnalysis(callTranscript);
    const sentimentScore = sentiment.score;
    const sentimentLabel = sentiment.label;

    const newCall = await VoiceAgentCall.create(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, sentimentScore, sentimentLabel, bento);
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

exports.initiateCall = async (req, res) => {
  try {
    const { prospectId, bento } = req.body;

    // Check rate limit
    const response = await axios.get(`${rateLimiterUrl}/${prospectId}`);
    if (!response.data.allowed) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    await initiateCall(prospectId, bento);
    res.status(200).json({ message: 'Call initiation initiated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
