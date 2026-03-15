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

async function checkHierarchicalThrottle(userId, prospectId, bento) {
  const userKey = `throttle:user:${userId}:${bento}`;
  const prospectKey = `throttle:prospect:${prospectId}:${bento}`;

  const userLimit = 1000; // Example limit: 1000 messages per hour for user
  const prospectLimit = 100; // Example limit: 100 messages per hour for prospect

  const [userCount, userTTL, prospectCount, prospectTTL] = await redis.multi([
    ['INCR', userKey],
    ['TTL', userKey],
    ['INCR', prospectKey],
    ['TTL', prospectKey],
  ]).exec();

  if (userTTL === -2) {
    // User key does not exist, set it with an expiration
    await redis.expire(userKey, 3600);
  }

  if (prospectTTL === -2) {
    // Prospect key does not exist, set it with an expiration
    await redis.expire(prospectKey, 3600);
  }

  if (userCount > userLimit || prospectCount > prospectLimit) {
    // Hierarchical throttle exceeded
    return false;
  }

  return true;
}

async function resetHierarchicalThrottle(userId, prospectId, bento) {
  const userKey = `throttle:user:${userId}:${bento}`;
  const prospectKey = `throttle:prospect:${prospectId}:${bento}`;

  await redis.del(userKey, prospectKey);
}

module.exports = { checkRateLimit, resetRateLimit, handleRateLimitError, checkHierarchicalThrottle, resetHierarchicalThrottle };
