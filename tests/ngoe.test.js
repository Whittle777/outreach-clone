const { run } = require('../services/ngoe');
const { acquireLock, releaseLock } = require('../services/stateMachine');
const { logTrackingPixelEvent, wrapLink } = require('../services/trackingPixelLogger');
const { analyzeOpenRates } = require('../services/openRateAnalyzer');
const { validateEmailBatch, validateWebhookPayload, validateSPFRecord, validateDMARCPolicy } = require('../services/validation');
const { checkRateLimit, resetRateLimit, handleRateLimitError, checkReputation } = require('../services/rateLimiting');
const { getShard } = require('../services/getShard');
const { google } = require('googleapis');
const axios = require('axios');
const redis = require('redis');
const { createAbuseComplaint } = require('../models/AbuseComplaint');
const { processBounceNotification } = require('../services/bounceNotificationProcessor');

jest.mock('../services/stateMachine', () => ({
  acquireLock: jest.fn(),
  releaseLock: jest.fn(),
}));

jest.mock('../services/trackingPixelLogger', () => ({
  logTrackingPixelEvent: jest.fn(),
  wrapLink: jest.fn(),
}));

jest.mock('../services/openRateAnalyzer', () => ({
  analyzeOpenRates: jest.fn(),
}));

jest.mock('../services/validation', () => ({
  validateEmailBatch: jest.fn(),
  validateWebhookPayload: jest.fn(),
  validateSPFRecord: jest.fn(),
  validateDMARCPolicy: jest.fn(),
}));

jest.mock('../services/rateLimiting', () => ({
  checkRateLimit: jest.fn(),
  resetRateLimit: jest.fn(),
  handleRateLimitError: jest.fn(),
  checkReputation: jest.fn(),
}));

jest.mock('../services/getShard', () => ({
  getShard: jest.fn(),
}));

jest.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: jest.fn().mockReturnValue({
        getClient: jest.fn().mockReturnValue({
          getAccessToken: jest.fn().mockResolvedValue('access_token'),
        }),
      }),
    },
    gmail: {
      users: {
        messages: {
          send: jest.fn().mockResolvedValue({}),
        },
      },
    },
  },
}));

jest.mock('axios');

jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    connect: jest.fn().mockResolvedValue(),
    set: jest.fn().mockResolvedValue(),
    del: jest.fn().mockResolvedValue(),
  }),
}));

jest.mock('../models/AbuseComplaint', () => ({
  createAbuseComplaint: jest.fn(),
}));

jest.mock('../services/bounceNotificationProcessor', () => ({
  processBounceNotification: jest.fn(),
}));

describe('NGOE Service', () => {
  describe('run', () => {
    it('should connect to producer and consumer', async () => {
      const producer = require('../config/kafka').producer();
      const consumer = require('../config/kafka').consumer();
      const redisClient = redis.createClient();

      await run();

      expect(producer.connect).toHaveBeenCalled();
      expect(consumer.connect).toHaveBeenCalled();
      expect(redisClient.connect).toHaveBeenCalled();
    });
  });

  describe('executeTask', () => {
    it('should handle sendEmail task', async () => {
      const task = {
        type: 'sendEmail',
        payload: {
          prospectId: '123',
          bento: 'default',
          emailContent: 'Hello, world!',
          provider: 'google',
        },
      };

      await executeTask(task);

      expect(google.gmail.users.messages.send).toHaveBeenCalled();
    });

    it('should handle updateDMARCPolicy task', async () => {
      const task = {
        type: 'updateDMARCPolicy',
        payload: {
          prospectId: '123',
          bento: 'default',
          dmarcPolicy: 'p=none',
        },
      };

      await executeTask(task);

      expect(validateDMARCPolicy).toHaveBeenCalledWith('p=none');
      expect(updateProspectDMARCPolicy).toHaveBeenCalledWith('123', 'default', 'p=none');
    });

    it('should handle logTrackingPixelEvent task', async () => {
      const task = {
        type: 'logTrackingPixelEvent',
        payload: {
          prospectId: '123',
          bento: 'default',
          trackingPixelData: 'tracking_data',
        },
      };

      await executeTask(task);

      expect(logTrackingPixelEvent).toHaveBeenCalledWith('123', 'default', 'tracking_data');
    });

    it('should handle wrapLinks task', async () => {
      const task = {
        type: 'wrapLinks',
        payload: {
          emailContent: 'Hello, <a href="https://example.com">world</a>!',
          trackingPixelData: 'tracking_data',
        },
      };

      await executeTask(task);

      expect(wrapLinksInEmail).toHaveBeenCalledWith('Hello, <a href="https://example.com">world</a>!', 'tracking_data');
    });

    it('should handle analyzeOpenRates task', async () => {
      const task = {
        type: 'analyzeOpenRates',
        payload: ['message1', 'message2'],
      };

      await executeTask(task);

      expect(analyzeOpenRates).toHaveBeenCalledWith(['message1', 'message2']);
    });

    it('should handle processBounceNotification task', async () => {
      const task = {
        type: 'processBounceNotification',
        payload: {
          prospectId: '123',
          bento: 'default',
          bounceType: 'hard',
        },
      };

      await executeTask(task);

      expect(processBounceNotification).toHaveBeenCalledWith({
        prospectId: '123',
        bento: 'default',
        bounceType: 'hard',
      });
    });

    it('should handle unknown task type', async () => {
      const task = {
        type: 'unknown',
        payload: {},
      };

      await executeTask(task);

      expect(console.error).toHaveBeenCalledWith('Unknown task type:', 'unknown');
    });
  });
});
