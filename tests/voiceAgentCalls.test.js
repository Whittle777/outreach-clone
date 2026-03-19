const request = require('supertest');
const app = require('../app'); // Assuming you have an app.js file that sets up the express server
const VoiceAgentCall = require('../models/VoiceAgentCall');
const AudioFile = require('../models/AudioFile');
const SentimentAnalysis = require('../models/SentimentAnalysis');
const rateLimiter = require('../services/rateLimiter');
const logger = require('../services/logger');

jest.mock('../models/VoiceAgentCall');
jest.mock('../models/AudioFile');
jest.mock('../models/SentimentAnalysis');
jest.mock('../services/rateLimiter');
jest.mock('../services/logger');

describe('VoiceAgentCalls Controller', () => {
  let server;

  beforeEach(() => {
    server = app.listen(3000);
  });

  afterEach(() => {
    server.close();
  });

  describe('POST /voiceAgentCalls', () => {
    it('should create a new voice agent call', async () => {
      const mockData = {
        prospectId: 1,
        callStatus: 'Connected',
        preGeneratedScript: 'Hello, this is a test call.',
        ttsAudioFileUrl: 'http://example.com/audio.mp3',
        callTranscript: 'Hello, this is a test call.',
        bento: 'bento1',
        ipAddress: '127.0.0.1',
      };

      VoiceAgentCall.create.mockResolvedValue(mockData);
      rateLimiter.isRateLimited.mockResolvedValue(false);
      rateLimiter.incrementRequestCount.mockResolvedValue(1);

      const response = await request(app)
        .post('/voiceAgentCalls')
        .send(mockData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockData);
      expect(VoiceAgentCall.create).toHaveBeenCalledWith(
        mockData.prospectId,
        mockData.callStatus,
        mockData.preGeneratedScript,
        mockData.ttsAudioFileUrl,
        mockData.callTranscript,
        mockData.bento,
        mockData.ipAddress
      );
    });

    it('should return 400 if data is not compliant with GDPR', async () => {
      const mockData = {
        prospectId: 1,
        callStatus: 'Connected',
        preGeneratedScript: 'Hello, this is a test call.',
        ttsAudioFileUrl: 'http://example.com/audio.mp3',
        callTranscript: 'Hello, this is a test call.',
        bento: 'bento1',
        ipAddress: '127.0.0.1',
      };

      VoiceAgentCall.create.mockRejectedValue(new Error('Data not compliant with GDPR'));

      const response = await request(app)
        .post('/voiceAgentCalls')
        .send(mockData);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Data not compliant with GDPR' });
    });

    it('should return 429 if rate limit is exceeded', async () => {
      const mockData = {
        prospectId: 1,
        callStatus: 'Connected',
        preGeneratedScript: 'Hello, this is a test call.',
        ttsAudioFileUrl: 'http://example.com/audio.mp3',
        callTranscript: 'Hello, this is a test call.',
        bento: 'bento1',
        ipAddress: '127.0.0.1',
      };

      rateLimiter.isRateLimited.mockResolvedValue(true);

      const response = await request(app)
        .post('/voiceAgentCalls')
        .send(mockData);

      expect(response.status).toBe(429);
      expect(response.body).toEqual({ error: 'Rate limit exceeded' });
    });
  });

  describe('GET /voiceAgentCalls', () => {
    it('should retrieve all voice agent calls', async () => {
      const mockCalls = [
        {
          id: 1,
          prospectId: 1,
          callStatus: 'Connected',
          preGeneratedScript: 'Hello, this is a test call.',
          ttsAudioFileUrl: 'http://example.com/audio.mp3',
          callTranscript: 'Hello, this is a test call.',
          bento: 'bento1',
          ipAddress: '127.0.0.1',
        },
        {
          id: 2,
          prospectId: 2,
          callStatus: 'Failed',
          preGeneratedScript: 'Hello, this is another test call.',
          ttsAudioFileUrl: 'http://example.com/audio2.mp3',
          callTranscript: 'Hello, this is another test call.',
          bento: 'bento2',
          ipAddress: '127.0.0.1',
        },
      ];

      VoiceAgentCall.getAll.mockResolvedValue(mockCalls);

      const response = await request(app)
        .get('/voiceAgentCalls');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCalls);
    });

    it('should return 500 if there is an error retrieving voice agent calls', async () => {
      VoiceAgentCall.getAll.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/voiceAgentCalls');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Database error' });
    });
  });

  describe('GET /voiceAgentCalls/filterChips', () => {
    it('should retrieve filter chips', async () => {
      const mockFilterChips = {
        Connected: 2,
        Failed: 1,
      };

      VoiceAgentCall.getFilterChips.mockResolvedValue(mockFilterChips);

      const response = await request(app)
        .get('/voiceAgentCalls/filterChips');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockFilterChips);
    });

    it('should return 500 if there is an error retrieving filter chips', async () => {
      VoiceAgentCall.getFilterChips.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/voiceAgentCalls/filterChips');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Database error' });
    });
  });
});
