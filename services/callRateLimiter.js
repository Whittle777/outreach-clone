const config = require('../services/config').getConfig();
const logger = require('../services/logger');

class CallRateLimiter {
  constructor() {
    this.rateLimits = config.rateLimits.teamsPhoneNumbers;
    this.callCounts = {};
    this.resetTimers = {};
  }

  async checkRateLimit(phoneNumber) {
    const limit = this.rateLimits[phoneNumber];
    if (!limit) {
      logger.error('Rate limit not configured for phone number:', phoneNumber);
      return false;
    }

    const { limit: callLimit, duration } = limit;
    const now = Date.now();
    const callCount = this.callCounts[phoneNumber] || 0;

    if (callCount >= callLimit) {
      const resetTime = this.resetTimers[phoneNumber] || now;
      if (now < resetTime) {
        logger.error('Rate limit exceeded for phone number:', phoneNumber);
        return false;
      }
      // Reset the call count and timer
      this.callCounts[phoneNumber] = 0;
      this.resetTimers[phoneNumber] = now + duration * 1000;
    }

    this.callCounts[phoneNumber] = (this.callCounts[phoneNumber] || 0) + 1;
    if (!this.resetTimers[phoneNumber]) {
      this.resetTimers[phoneNumber] = now + duration * 1000;
    }

    return true;
  }
}

module.exports = new CallRateLimiter();
