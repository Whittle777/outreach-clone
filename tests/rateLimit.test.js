const request = require('supertest');
const app = require('../app'); // Assuming you have an app.js file that sets up your Express server
const redisClient = require('../services/redisClient');

describe('Rate Limit Middleware', () => {
  beforeAll(async () => {
    await redisClient.connect();
  });

  afterAll(async () => {
    await redisClient.disconnect();
  });

  it('should allow requests within the rate limit', async () => {
    const prospectId = 'test-prospect-1';
    const bento = 'test-bento-1';

    for (let i = 0; i < 100; i++) {
      const response = await request(app)
        .get('/some-endpoint')
        .query({ prospectId, bento, trackingPixelData: 'test-data' });

      expect(response.status).toBe(200);
    }
  });

  it('should block requests when rate limit is exceeded', async () => {
    const prospectId = 'test-prospect-2';
    const bento = 'test-bento-2';

    for (let i = 0; i < 101; i++) {
      const response = await request(app)
        .get('/some-endpoint')
        .query({ prospectId, bento, trackingPixelData: 'test-data' });

      if (i < 100) {
        expect(response.status).toBe(200);
      } else {
        expect(response.status).toBe(429);
        expect(response.body.message).toBe('Rate limit exceeded');
      }
    }
  });
});
