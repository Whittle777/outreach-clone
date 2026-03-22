const config = require('../services/config').getConfig();
const moment = require('moment');

const callRateLimiting = (req, res, next) => {
  const { phoneNumber, callType } = req.body;
  const rateLimits = config.rateLimits[callType][phoneNumber];

  if (!rateLimits) {
    return res.status(400).json({ error: 'Phone number not allowed for this call type' });
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

const timeBlockMiddleware = (req, res, next) => {
  const now = moment();
  const dayOfWeek = now.isoWeekday();
  const hour = now.hour();

  const timeBlocks = config.timeBlocks;
  const isAllowed = timeBlocks.some(block => {
    return (
      block.days.includes(dayOfWeek) &&
      hour >= block.startTime &&
      hour < block.endTime
    );
  });

  if (!isAllowed) {
    return res.status(403).json({ error: 'Call outside approved time blocks' });
  }

  next();
};

module.exports = {
  callRateLimiting,
  timeBlockMiddleware
};
