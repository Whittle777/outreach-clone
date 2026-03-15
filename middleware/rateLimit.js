const { checkRateLimit, handleRateLimitError } = require('../services/rateLimiting');

async function rateLimit(req, res, next) {
  const { prospectId, bento } = req.query;

  if (!prospectId || !bento) {
    return res.status(400).json({ message: 'prospectId and bento are required query parameters' });
  }

  const isAllowed = await checkRateLimit(prospectId, bento);

  if (isAllowed) {
    next();
  } else {
    handleRateLimitError(prospectId, bento);
    return res.status(429).json({ message: 'Rate limit exceeded' });
  }
}

module.exports = rateLimit;
