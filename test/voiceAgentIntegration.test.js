const axios = require('axios');
const { VoiceAgentIntegration } = require('../services/voiceAgentIntegration');
const { voiceCallLimiter } = require('../services/rateLimiter');
const { logger } = require('../services/logger');

jest.mock('axios');
jest.mock('../services/rateLimiter');
jest.mock('../services/logger');

describe('VoiceAgentIntegration', () => {
  let voiceAgentIntegration;

  beforeEach(() => {
    voiceAgentIntegration = new VoiceAgentIntegration('test-api-key', 'https://api.example.com');
  });

  describe('createCall', () => {
    it('should create a call successfully', async () => {
      const prospectId = '123';
      const phoneNumber = '1234567890';
      const script = 'Hello, this is a test call.';
      const country = 'US';

      const mockResponse = { data: { callId: 'call-123' } };
      axios.post.mockResolvedValue(mockResponse);

      const result = await voiceAgentIntegration.createCall(prospectId, phoneNumber, script, country);

      expect(axios.post).toHaveBeenCalledWith(`${voiceAgentIntegration.apiUrl}/calls`, {
        prospectId,
        phoneNumber,
        script,
        country,
      }, {
        headers: {
          'Authorization': `Bearer ${voiceAgentIntegration.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      expect(voiceCallLimiter.incrementRequestCount).toHaveBeenCalledWith(`call:${phoneNumber}`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw an error if rate limit is exceeded', async () => {
      const prospectId = '123';
      const phoneNumber = '1234567890';
      const script = 'Hello, this is a test call.';
      const country = 'US';

      voiceCallLimiter.isRateLimited.mockResolvedValue(true);

      await expect(voiceAgentIntegration.createCall(prospectId, phoneNumber, script, country)).rejects.toThrow('Rate limit exceeded');

      expect(axios.post).not.toHaveBeenCalled();
      expect(voiceCallLimiter.incrementRequestCount).not.toHaveBeenCalled();
    });

    it('should throw an error if call creation fails', async () => {
      const prospectId = '123';
      const phoneNumber = '1234567890';
      const script = 'Hello, this is a test call.';
      const country = 'US';

      const mockError = new Error('Network Error');
      axios.post.mockRejectedValue(mockError);

      await expect(voiceAgentIntegration.createCall(prospectId, phoneNumber, script, country)).rejects.toThrow('Failed to create call: Network Error');

      expect(axios.post).toHaveBeenCalledWith(`${voiceAgentIntegration.apiUrl}/calls`, {
        prospectId,
        phoneNumber,
        script,
        country,
      }, {
        headers: {
          'Authorization': `Bearer ${voiceAgentIntegration.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      expect(voiceCallLimiter.incrementRequestCount).not.toHaveBeenCalled();
    });
  });

  describe('detectHardBounce', () => {
    it('should detect hard bounce successfully', async () => {
      const prospectId = '123';
      const phoneNumber = '1234567890';

      const mockResponse = { data: { isHardBounce: true } };
      axios.get.mockResolvedValue(mockResponse);

      const result = await voiceAgentIntegration.detectHardBounce(prospectId, phoneNumber);

      expect(axios.get).toHaveBeenCalledWith(`${voiceAgentIntegration.apiUrl}/bounce-detection`, {
        params: {
          prospectId,
          phoneNumber,
        },
        headers: {
          'Authorization': `Bearer ${voiceAgentIntegration.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual(mockResponse.data.isHardBounce);
    });

    it('should throw an error if hard bounce detection fails', async () => {
      const prospectId = '123';
      const phoneNumber = '1234567890';

      const mockError = new Error('Network Error');
      axios.get.mockRejectedValue(mockError);

      await expect(voiceAgentIntegration.detectHardBounce(prospectId, phoneNumber)).rejects.toThrow('Failed to detect hard bounce: Network Error');

      expect(axios.get).toHaveBeenCalledWith(`${voiceAgentIntegration.apiUrl}/bounce-detection`, {
        params: {
          prospectId,
          phoneNumber,
        },
        headers: {
          'Authorization': `Bearer ${voiceAgentIntegration.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('handleFailedState', () => {
    it('should handle failed state successfully', async () => {
      const prospectId = '123';
      const callId = 'call-123';

      const mockResponse = { data: { success: true } };
      axios.post.mockResolvedValue(mockResponse);

      const result = await voiceAgentIntegration.handleFailedState(prospectId, callId);

      expect(axios.post).toHaveBeenCalledWith(`${voiceAgentIntegration.apiUrl}/calls/${callId}/fail`, {
        prospectId,
      }, {
        headers: {
          'Authorization': `Bearer ${voiceAgentIntegration.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual(mockResponse.data);
    });

    it('should throw an error if handling failed state fails', async () => {
      const prospectId = '123';
      const callId = 'call-123';

      const mockError = new Error('Network Error');
      axios.post.mockRejectedValue(mockError);

      await expect(voiceAgentIntegration.handleFailedState(prospectId, callId)).rejects.toThrow('Failed to handle failed state: Network Error');

      expect(axios.post).toHaveBeenCalledWith(`${voiceAgentIntegration.apiUrl}/calls/${callId}/fail`, {
        prospectId,
      }, {
        headers: {
          'Authorization': `Bearer ${voiceAgentIntegration.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('startTranscription', () => {
    it('should start transcription successfully', async () => {
      const callId = 'call-123';

      const mockResponse = { data: { success: true } };
      axios.post.mockResolvedValue(mockResponse);

      const result = await voiceAgentIntegration.startTranscription(callId);

      expect(axios.post).toHaveBeenCalledWith(`${voiceAgentIntegration.apiUrl}/calls/${callId}/transcription/start`, {
        callId,
      }, {
        headers: {
          'Authorization': `Bearer ${voiceAgentIntegration.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual(mockResponse.data);
    });

    it('should throw an error if starting transcription fails', async () => {
      const callId = 'call-123';

      const mockError = new Error('Network Error');
      axios.post.mockRejectedValue(mockError);

      await expect(voiceAgentIntegration.startTranscription(callId)).rejects.toThrow('Failed to start transcription: Network Error');

      expect(axios.post).toHaveBeenCalledWith(`${voiceAgentIntegration.apiUrl}/calls/${callId}/transcription/start`, {
        callId,
      }, {
        headers: {
          'Authorization': `Bearer ${voiceAgentIntegration.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('detectResistanceOrRegulatoryEdgeCases', () => {
    it('should detect resistance or regulatory edge cases successfully', async () => {
      const callId = 'call-123';

      const mockResponse = { data: { isResistanceOrRegulatoryEdgeCase: true } };
      axios.get.mockResolvedValue(mockResponse);

      const result = await voiceAgentIntegration.detectResistanceOrRegulatoryEdgeCases(callId);

      expect(axios.get).toHaveBeenCalledWith(`${voiceAgentIntegration.apiUrl}/calls/${callId}/resistance-detection`, {
        headers: {
          'Authorization': `Bearer ${voiceAgentIntegration.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual(mockResponse.data.isResistanceOrRegulatoryEdgeCase);
    });

    it('should throw an error if detecting resistance or regulatory edge cases fails', async () => {
      const callId = 'call-123';

      const mockError = new Error('Network Error');
      axios.get.mockRejectedValue(mockError);

      await expect(voiceAgentIntegration.detectResistanceOrRegulatoryEdgeCases(callId)).rejects.toThrow('Failed to detect resistance or regulatory edge cases: Network Error');

      expect(axios.get).toHaveBeenCalledWith(`${voiceAgentIntegration.apiUrl}/calls/${callId}/resistance-detection`, {
        headers: {
          'Authorization': `Bearer ${voiceAgentIntegration.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
    });
  });
});
