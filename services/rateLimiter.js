const Redis = require('ioredis');
const redis = new Redis();

class RateLimiter {
  constructor(limit, duration) {
    this.limit = limit;
    this.duration = duration;
  }

  async isRateLimited(key) {
    const count = await redis.get(key);
    return count >= this.limit;
  }

  async incrementRequestCount(key) {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, this.duration);
    }
    return count;
  }
}

module.exports = new RateLimiter(10, 60); // 10 requests per minute
