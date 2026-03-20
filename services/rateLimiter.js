const Redis = require('ioredis');
const redis = new Redis();
const doubleWriteStrategy = require('../services/doubleWriteStrategy');
const logger = require('../services/logger');

class RateLimiter {
  constructor(limit, duration) {
    this.limit = limit;
    this.duration = duration;
  }

  async isRateLimited(key) {
    const count = await redis.get(key);
    if (count >= this.limit) {
      logger.warn('Rate limit hit', { key, count, limit: this.limit });
      return true;
    }
    return false;
  }

  async incrementRequestCount(key) {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, this.duration);
    }
    await this.write({ key, count });
    logger.info('Request count incremented', { key, count });
    return count;
  }

  async write(data) {
    // Implement double-write logic for legacy datastore
    await doubleWriteStrategy.write(data);
  }
}

class DialingRateLimiter extends RateLimiter {
  constructor(limit, duration) {
    super(limit, duration);
  }

  async isDialingRateLimited(phoneNumber) {
    const key = `dialingLimit:${phoneNumber}`;
    return await this.isRateLimited(key);
  }

  async incrementDialingCount(phoneNumber) {
    const key = `dialingLimit:${phoneNumber}`;
    return await this.incrementRequestCount(key);
  }
}

module.exports = {
  voiceCallLimiter: new RateLimiter(process.env.VOICE_CALL_LIMIT, process.env.VOICE_CALL_DURATION),
  emailLimiter: new RateLimiter(process.env.EMAIL_LIMIT, process.env.EMAIL_DURATION),
  audioFileLimiter: new RateLimiter(process.env.AUDIO_FILE_LIMIT, process.env.AUDIO_FILE_DURATION),
  dialingRateLimiter: new DialingRateLimiter(process.env.DIALING_LIMIT, process.env.DIALING_DURATION),
};
