const assert = require('assert');
const request = require('supertest');
const app = require('../app');
const config = require('../config').getConfig();

describe('RateLimiter', function() {
  const { refillRate, bucketCapacity } = config.getConfig();

  it('should prevent "Spam Risk" flags when rate limit is hit', async function() {
    const key = 'rate_limit:carrier:1234567890';

    // Increment count until rate limit is hit
    for (let i = 0; i < refillRate; i++) {
      await request(app)
        .get('/')
        .expect(200);
    }

    // Check if rate limit is hit
    const response = await request(app)
      .get('/')
      .expect(429);

    assert.strictEqual(response.body.message, 'Too many requests', 'Rate limit should be hit');
  });

  it('should allow requests within rate limit', async function() {
    const key = 'rate_limit:carrier:1234567890';

    // Increment count within rate limit
    for (let i = 0; i < refillRate - 1; i++) {
      await request(app)
        .get('/')
        .expect(200);
    }

    // Check if rate limit is not hit
    const response = await request(app)
      .get('/')
      .expect(200);

    assert.strictEqual(response.status, 200, 'Rate limit should not be hit');
  });
});
