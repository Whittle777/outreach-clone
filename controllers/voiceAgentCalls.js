const VoiceAgentCall = require('../models/VoiceAgentCall');
const sentimentAnalysis = require('sentiment-analysis'); // Hypothetical library
const axios = require('axios');
const logger = require('../services/logger');
const azureAcsService = require('../services/azureAcsService');
const RateLimiterService = require('../services/rateLimiterService');
const GeolocationService = require('../services/geolocationService');

const rateLimiterUrl = process.env.RATE_LIMITER_URL || 'http://localhost:8080/rate-limit';
const rateLimiterService = new RateLimiterService(rateLimiterUrl);
const geolocationService = new GeolocationService(process.env.GEOLOCATION_API_KEY);

exports.create = async (req, res) => {
  try {
    const { prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, bento, ipAddress } = req.body;

    // Check rate limit
    const isAllowed = await rateLimiterService.checkRateLimit(prospectId);
    if (!isAllowed) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    // Determine the user's country based on IP address
    const country = await geolocationService.getCountryByIp(ipAddress);

    // Perform sentiment analysis
    const sentiment = sentimentAnalysis(callTranscript);
    const sentimentScore = sentiment.score;
    const sentimentLabel = sentiment.label;

    const logMessage = `Call created for prospect ${prospectId} with status ${callStatus} from country ${country}`;
    const newCall = await VoiceAgentCall.create(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, sentimentScore, sentimentLabel, bento, logMessage, country);
    logger.log(logMessage);
    res.status(201).json(newCall);
  } catch (error) {
    logger.error(`Error creating voice agent call: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const calls = await VoiceAgentCall.getAll();
    res.status(200).json(calls);
  } catch (error) {
    logger.error(`Error retrieving voice agent calls: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.initiateCall = async (req, res) => {
  try {
    const { prospectId, bento, teamsResourceAccountObjectId, ipAddress } = req.body;

    // Check rate limit
    const isAllowed = await rateLimiterService.checkRateLimit(prospectId);
    if (!isAllowed) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    // Determine the user's country based on IP address
    const country = await geolocationService.getCountryByIp(ipAddress);

    const callData = await azureAcsService.createCall(prospectId, bento, teamsResourceAccountObjectId);
    const callId = callData.id; // Assuming the response contains the call ID

    // Handle voicemail drop
    await azureAcsService.handleVoicemailDrop(callId, bento);

    const logMessage = `Call initiation initiated for prospect ${prospectId} from country ${country}`;
    logger.log(logMessage);
    res.status(200).json({ message: 'Call initiation initiated' });
  } catch (error) {
    logger.error(`Error initiating voice agent call: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
