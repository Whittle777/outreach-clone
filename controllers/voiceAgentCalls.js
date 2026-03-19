const VoiceAgentCall = require('../models/VoiceAgentCall');
const rateLimiter = require('../services/rateLimiter');
const logger = require('../services/logger');

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

    // Create voice agent call
    const newCall = await VoiceAgentCall.create(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, bento, ipAddress);

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

function isGDPRCompliant(data) {
  // Example GDPR compliance check
  // Ensure that the data contains a valid email and does not contain sensitive data
  return data.email && !data.sensitiveData;
}
