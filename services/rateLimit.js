const redisClient = require('../services/redisClient');

async function checkRateLimit(prospectId, bento) {
  const script = `
    local key = KEYS[1]
    local limit = tonumber(ARGV[1])
    local expireTime = tonumber(ARGV[2])

    local current = redis.call("get", key)
    if not current then
        current = 0
    end

    if tonumber(current) < limit then
        redis.call("INCR", key)
        redis.call("EXPIRE", key, expireTime)
        return 1
    else
        return 0
    end
  `;

  const key = `rate_limit:${prospectId}:${bento}`;
  const limit = 100; // Example limit
  const expireTime = 3600; // Example expire time in seconds (1 hour)

  const result = await redisClient.eval(script, 1, key, limit, expireTime);
  return result === 1;
}

async function handleRateLimitError(prospectId, bento) {
  // Log the rate limit error or take other necessary actions
  console.error(`Rate limit exceeded for prospectId: ${prospectId}, bento: ${bento}`);
}

module.exports = {
  checkRateLimit,
  handleRateLimitError,
};
