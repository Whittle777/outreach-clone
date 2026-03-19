const { checkRateLimit, handleRateLimitError } = require('../services/rateLimit');
const { getAbuseComplaintCount } = require('../models/AbuseComplaint');
const { monitorAbuseComplaints } = require('../services/abuseComplaintMonitor');
const { callGoMicroservice } = require('../services/goMicroservice'); // Placeholder for Go microservice integration
const redisClient = require('../services/redisClient');
const { authenticateMicrosoft } = require('../services/microsoftAuth');
const { makeOutboundCall } = require('../services/acsCallAutomation');
const { getTeamsResourceAccount } = require('../services/teamsResourceAccount');
const { uploadAudioFile } = require('../services/audioFileStorage');
const { AudioFile } = require('../models/AudioFile');
const MessageBroker = require('../messageBroker');

async function rateLimit(req, res, next) {
  const { prospectId, bento, trackingPixelData } = req.query;

  if (!prospectId || !bento) {
    return res.status(400).json({ message: 'prospectId and bento are required query parameters' });
  }

  // Monitor abuse complaints periodically
  await monitorAbuseComplaints();

  const abuseComplaintCount = await getAbuseComplaintCount(bento);
  if (abuseComplaintCount > 0) {
    return res.status(403).json({ message: 'Abuse complaint detected' });
  }

  // Call Go microservice for rate limiting
  const isAllowed = await callGoMicroservice(prospectId, bento);

  if (isAllowed) {
    // Check if the request is for a voice agent call
    if (req.path === '/voice-agent/call') {
      try {
        const callResponse = await makeOutboundCall(prospectId, bento);
        req.callResponse = callResponse;
        next();
      } catch (error) {
        return res.status(500).json({ message: 'Failed to make outbound call' });
      }
    } else if (req.path === '/teams-resource-account') {
      // Check if the request is for a Teams Resource Account operation
      const teamsResourceAccount = await getTeamsResourceAccount(req.userId, bento);
      if (!teamsResourceAccount) {
        return res.status(404).json({ message: 'Teams Resource Account not found' });
      }
      next();
    } else if (req.path === '/upload-audio-file') {
      // Handle audio file upload
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      const fileUrl = await uploadAudioFile(req.file.originalname, req.file.path);
      const audioFile = await AudioFile.create(req.file, { fileUrl });
      res.status(201).json(audioFile);
    } else {
      next();
    }
  } else {
    handleRateLimitError(prospectId, bento);
    return res.status(429).json({ message: 'Rate limit exceeded' });
  }
}

module.exports = rateLimit;
