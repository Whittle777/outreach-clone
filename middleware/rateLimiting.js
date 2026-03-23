const { getAsync, setAsync } = require('../utils/redisClient');
const config = require('../config').getConfig();

const rateLimitingMiddleware = async (req, res, next) => {
  const key = `rateLimit:${req.ip}`;
  const now = Date.now();
  const refillRate = config.refillRate;
  const bucketCapacity = config.bucketCapacity;

  const [currentTokens, lastRefill] = await Promise.all([
    getAsync(key),
    getAsync(`${key}:lastRefill`)
  ]);

  let tokens = currentTokens ? parseInt(currentTokens, 10) : bucketCapacity;
  let lastRefillTimestamp = lastRefill ? parseInt(lastRefill, 10) : now;

  const timeElapsed = now - lastRefillTimestamp;
  const tokensToAdd = Math.floor(timeElapsed * refillRate / 1000);

  if (tokensToAdd > 0) {
    tokens = Math.min(tokens + tokensToAdd, bucketCapacity);
    lastRefillTimestamp = now;
  }

  if (tokens > 0) {
    await Promise.all([
      setAsync(key, tokens - 1),
      setAsync(`${key}:lastRefill`, lastRefillTimestamp)
    ]);
    next();
  } else {
    res.status(429).json({ message: 'Too many requests' });
  }
};

module.exports = rateLimitingMiddleware;
