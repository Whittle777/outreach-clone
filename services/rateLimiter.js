const Redis = require('ioredis');
const redis = new Redis();
const doubleWriteStrategy = require('../services/doubleWriteStrategy');

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

  async write(data) {
    // Implement double-write logic for legacy datastore
    // For now, let's assume it's a no-op
    await doubleWriteStrategy.write(data);
  }
}

module.exports = {
  voiceCallLimiter: new RateLimiter(10, 60), // 10 voice calls per minute
  emailLimiter: new RateLimiter(20, 60), // 20 emails per minute
};
