const { checkRateLimit, handleRateLimitError } = require('../services/rateLimiting');
const { getAbuseComplaintCount } = require('../models/AbuseComplaint');
const { monitorAbuseComplaints } = require('../services/abuseComplaintMonitor');
const { callGoMicroservice } = require('../services/goMicroservice'); // Placeholder for Go microservice integration

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
    next();
  } else {
    handleRateLimitError(prospectId, bento);
    return res.status(429).json({ message: 'Rate limit exceeded' });
  }
}

module.exports = rateLimit;
