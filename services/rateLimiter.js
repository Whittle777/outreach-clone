const redis = require('redis');
const client = redis.createClient();

class RateLimiter {
  constructor(limit, duration) {
    this.limit = limit;
    this.duration = duration;
  }

  async isRateLimited(key) {
    const count = await client.get(key);
    if (count >= this.limit) {
      logger.warn('Rate limit hit', { key, count, limit: this.limit });
      return true;
    }
    return false;
  }

  async incrementCount(key) {
    await client.incr(key);
    await client.expire(key, this.duration);
  }
}

module.exports = RateLimiter;
