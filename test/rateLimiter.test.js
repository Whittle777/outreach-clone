const assert = require('assert');
const RateLimiter = require('../services/rateLimiter');
const config = require('../services/config').getConfig();

describe('RateLimiter', function() {
  let rateLimiter;

  beforeEach(function() {
    const rateLimitConfig = config.rateLimits.teamsPhoneNumbers['1234567890'];
    rateLimiter = new RateLimiter(rateLimitConfig.limit, rateLimitConfig.duration);
  });

  it('should prevent "Spam Risk" flags when rate limit is hit', async function() {
    const key = 'rate_limit:carrier:1234567890';

    // Increment count until rate limit is hit
    for (let i = 0; i < rateLimiter.limit; i++) {
      await rateLimiter.incrementCount(key);
    }

    // Check if rate limit is hit
    const isRateLimited = await rateLimiter.isRateLimited(key);
    assert.strictEqual(isRateLimited, true, 'Rate limit should be hit');
  });

  it('should allow requests within rate limit', async function() {
    const key = 'rate_limit:carrier:1234567890';

    // Increment count within rate limit
    for (let i = 0; i < rateLimiter.limit - 1; i++) {
      await rateLimiter.incrementCount(key);
    }

    // Check if rate limit is not hit
    const isRateLimited = await rateLimiter.isRateLimited(key);
    assert.strictEqual(isRateLimited, false, 'Rate limit should not be hit');
  });
});
