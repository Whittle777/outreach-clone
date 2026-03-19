// controllers/voiceAgentCalls.js

const VoiceAgentCall = require('../models/VoiceAgentCall');
const rateLimiter = require('../services/rateLimiter');
const logger = require('../services/logger');
const aiGenerator = require('../services/aiGenerator');
const TtsService = require('../services/ttsService');
const config = require('../config/settings');
const ttsService = new TtsService(config.elevenLabs.apiKey);
const path = require('path');

exports.create = async (req, res) => {
  try {
    const { prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, bento, ipAddress } = req.body;

    // Check GDPR compliance
    if (!isGDPRCompliant(req.body)) {
      return res.status(400).json({ error: 'Data not compliant with GDPR' });
    }

    // Check rate limit
    const rateLimitKey = `rate_limit:${ipAddress}`;
    if (await rateLimiter.isRateLimited(rateLimitKey)) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    // Increment request count
    await rateLimiter.incrementRequestCount(rateLimitKey);

    // Generate AI-generated call goal and talk track
    const prospectData = await getProspectData(prospectId); // Assume this function fetches prospect data
    const callGoal = await aiGenerator.generateCallGoal(prospectData);
    const talkTrack = await aiGenerator.generateTalkTrack(prospectData);

    // Create voice agent call with AI-generated data
    const newCall = await VoiceAgentCall.create(prospectId, callStatus, preGeneratedScript || talkTrack, ttsAudioFileUrl, callTranscript, bento, ipAddress, callGoal);

    // Log the flag for debugging purposes
    if (newCall.hasResistanceOrRegulatoryFlag) {
      const logMessage = `Call for prospect ${prospectId} from IP ${ipAddress} hit resistance or regulatory edge case`;
      logger.log(logMessage);
    }

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

exports.getFilterChips = async (req, res) => {
  try {
    const filterChips = await VoiceAgentCall.getFilterChips();
    res.status(200).json(filterChips);
  } catch (error) {
    logger.error(`Error retrieving filter chips: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.generateTtsAudio = async (req, res) => {
  try {
    const { prospectId, preGeneratedScript } = req.body;

    // Validate input
    if (!prospectId || !preGeneratedScript) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ttsAudioFilePath = path.join(__dirname, `tts_audio_${prospectId}.wav`);
    const ttsAudioFileUrl = await ttsService.generateAndStoreTtsAudio(preGeneratedScript, config.elevenLabs.voiceId, ttsAudioFilePath);

    res.status(200).json({ ttsAudioFileUrl });
  } catch (error) {
    logger.error('Failed to generate TTS audio file:', error);
    res.status(500).json({ error: 'Failed to generate TTS audio file' });
  }
};

function isGDPRCompliant(data) {
  // Example GDPR compliance check
  // Ensure that the data contains a valid email and does not contain sensitive data
  return data.email && !data.sensitiveData;
}

async function getProspectData(prospectId) {
  // Simulate fetching prospect data
  // In a real-world scenario, this would involve querying the database
  return {
    firstName: 'John',
    lastName: 'Doe',
    companyName: 'Example Corp',
  };
}
