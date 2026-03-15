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

async function handleRateLimitError(prospectId, bento) {
  // Implement logic to handle rate limit errors, e.g., retry later or log the error
  console.error(`Rate limit exceeded for prospectId: ${prospectId}, bento: ${bento}`);
  // Example: reset the rate limit after some time
  setTimeout(() => resetRateLimit(prospectId, bento), 3600000); // Reset after 1 hour
}

module.exports = { checkRateLimit, resetRateLimit, handleRateLimitError };
