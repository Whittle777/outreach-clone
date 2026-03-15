const redis = require('../config/redis');

const rateLimitScript = `
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local interval = tonumber(ARGV[2])
  local current = tonumber(redis.call('GET', key)) or 0
  local timestamp = tonumber(redis.call('GET', key .. ':timestamp')) or 0
  local now = tonumber(ARGV[3])

  if now - timestamp > interval then
    redis.call('SET', key, 1)
    redis.call('SET', key .. ':timestamp', now)
    redis.call('EXPIRE', key, interval)
    return 1
  end

  if current < limit then
    redis.call('INCR', key)
    redis.call('EXPIRE', key, interval)
    return 1
  end

  return 0
`;

async function checkRateLimit(prospectId, bento) {
  const key = `rate_limit:${prospectId}:${bento}`;
  const limit = 100; // Example limit: 100 messages per hour
  const interval = 3600; // 1 hour in seconds
  const now = Date.now() / 1000;

  const result = await redis.eval(rateLimitScript, 1, key, limit, interval, now);
  return result === 1;
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
