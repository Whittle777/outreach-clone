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

  static async isCarrierRateLimited(carrier, phoneNumber) {
    const config = require('./config').getConfig();
    const rateLimitConfig = config.rateLimits.teamsPhoneNumbers[phoneNumber];
    if (!rateLimitConfig) {
      logger.warn('No rate limit configuration found for phone number', { phoneNumber });
      return false;
    }
    const rateLimiter = new RateLimiter(rateLimitConfig.limit, rateLimitConfig.duration);
    const key = `rate_limit:${carrier}:${phoneNumber}`;
    return await rateLimiter.isRateLimited(key);
  }

  static async incrementCarrierRateLimit(carrier, phoneNumber) {
    const config = require('./config').getConfig();
    const rateLimitConfig = config.rateLimits.teamsPhoneNumbers[phoneNumber];
    if (!rateLimitConfig) {
      logger.warn('No rate limit configuration found for phone number', { phoneNumber });
      return;
    }
    const rateLimiter = new RateLimiter(rateLimitConfig.limit, rateLimitConfig.duration);
    const key = `rate_limit:${carrier}:${phoneNumber}`;
    await rateLimiter.incrementCount(key);
  }
}

module.exports = RateLimiter;
