const config = require('../services/config').getConfig();

const callRateLimiting = (req, res, next) => {
  const { phoneNumber } = req.body;
  const rateLimits = config.rateLimits.teamsPhoneNumbers[phoneNumber];

  if (!rateLimits) {
    return res.status(400).json({ error: 'Phone number not allowed' });
  }

  const { limit, duration } = rateLimits;
  const now = Date.now();
  const callsInWindow = req.session.calls.filter(call => now - call.timestamp < duration * 1000).length;

  if (callsInWindow >= limit) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  if (!req.session.calls) {
    req.session.calls = [];
  }

  req.session.calls.push({ timestamp: now });

  next();
};

module.exports = callRateLimiting;
