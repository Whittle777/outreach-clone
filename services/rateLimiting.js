const Redis = require('ioredis');
const redis = new Redis();

async function checkRateLimit(prospectId, bento) {
  const key = `rate_limit:${prospectId}:${bento}`;
  const limit = 100; // Example limit: 100 messages per hour
  const window = 3600; // 1 hour in seconds

  const [currentCount, ttl] = await redis.multi([
    ['INCR', key],
    ['TTL', key],
  ]).exec();

  if (ttl === -2) {
    // Key does not exist, set it with an expiration
    await redis.expire(key, window);
  } else if (currentCount > limit) {
    // Rate limit exceeded
    return false;
  }

  return true;
}

async function resetRateLimit(prospectId, bento) {
  const key = `rate_limit:${prospectId}:${bento}`;
  await redis.del(key);
}

module.exports = { checkRateLimit, resetRateLimit };
