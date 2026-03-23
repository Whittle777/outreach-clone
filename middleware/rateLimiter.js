const Redis = require('ioredis');
const redis = new Redis();

class RateLimiter {
  constructor(limit, duration) {
    this.limit = limit;
    this.duration = duration;
  }

  async incrementCount(key) {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, this.duration);
    }
    return count;
  }

  async isRateLimited(key) {
    const count = await redis.get(key);
    return count >= this.limit;
  }
}

module.exports = (limit, duration) => {
  const rateLimiter = new RateLimiter(limit, duration);

  return async (req, res, next) => {
    const key = `${req.ip}:${req.originalUrl}`;
    const count = await rateLimiter.incrementCount(key);

    if (count > rateLimiter.limit) {
      res.status(429).json({ message: 'Too many requests' });
    } else {
      next();
    }
  };
};
