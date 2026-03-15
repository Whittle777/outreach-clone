const redis = require('../config/redis');

async function checkRateLimit(prospectId, bento) {
  const key = `rate_limit:${prospectId}:${bento}`;
  const limit = 100; // Example limit: 100 messages per hour
  const interval = 3600; // 1 hour in seconds

  const [current, timestamp] = await redis.multi([
    ['GET', key],
    ['GET', `${key}:timestamp`]
  ]).exec();

  const currentCount = current ? parseInt(current) : 0;
  const lastTimestamp = timestamp ? parseInt(timestamp) : 0;

  const now = Date.now() / 1000;

  if (now - lastTimestamp > interval) {
    // Reset the rate limit if the interval has passed
    await redis.multi([
      ['SET', key, 1],
      ['SET', `${key}:timestamp`, now]
    ]).exec();
    return true;
  }

  if (currentCount < limit) {
    await redis.multi([
      ['INCR', key],
      ['EXPIRE', key, interval]
    ]).exec();
    return true;
  }

  return false;
}

async function resetRateLimit(prospectId, bento) {
  const key = `rate_limit:${prospectId}:${bento}`;
  await redis.del(key, `${key}:timestamp`);
}

async function handleRateLimitError(prospectId, bento) {
  console.error(`Rate limit exceeded for prospectId: ${prospectId}, bento: ${bento}`);
  // Example: reset the rate limit after some time
  setTimeout(() => resetRateLimit(prospectId, bento), 3600000); // Reset after 1 hour
}

module.exports = { checkRateLimit, resetRateLimit, handleRateLimitError };
