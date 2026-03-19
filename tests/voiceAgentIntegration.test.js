const VoiceAgentIntegration = require('../services/voiceAgentIntegration');
const axios = require('axios');
const { voiceCallLimiter } = require('../services/rateLimiter');
const sinon = require('sinon');

describe('VoiceAgentIntegration', () => {
  let voiceAgentIntegration;
  let axiosPostStub;
  let voiceCallLimiterIsRateLimitedStub;
  let voiceCallLimiterIncrementRequestCountStub;

  beforeEach(() => {
    voiceAgentIntegration = new VoiceAgentIntegration('testApiKey', 'https://api.example.com');
    axiosPostStub = sinon.stub(axios, 'post');
    voiceCallLimiterIsRateLimitedStub = sinon.stub(voiceCallLimiter, 'isRateLimited');
    voiceCallLimiterIncrementRequestCountStub = sinon.stub(voiceCallLimiter, 'incrementRequestCount');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createCall', () => {
    it('should create a call if not rate limited', async () => {
      voiceCallLimiterIsRateLimitedStub.resolves(false);
      axiosPostStub.resolves({ data: { id: 123 } });
      const result = await voiceAgentIntegration.createCall('p123', '1234567890', 'Hello', 'US');
      expect(result).to.deep.equal({ id: 123 });
      expect(voiceCallLimiterIsRateLimitedStub.calledOnceWith('call:1234567890')).to.be.true;
      expect(voiceCallLimiterIncrementRequestCountStub.calledOnceWith('call:1234567890')).to.be.true;
      expect(axiosPostStub.calledOnceWith('https://api.example.com/calls', {
        prospectId: 'p123',
        phoneNumber: '1234567890',
        script: 'Hello',
        country: 'US',
      }, {
        headers: {
          'Authorization': 'Bearer testApiKey',
          'Content-Type': 'application/json',
        },
      })).to.be.true;
    });

    it('should throw an error if rate limited', async () => {
      voiceCallLimiterIsRateLimitedStub.resolves(true);
      try {
        await voiceAgentIntegration.createCall('p123', '1234567890', 'Hello', 'US');
      } catch (error) {
        expect(error.message).to.equal('Rate limit exceeded');
      }
      expect(voiceCallLimiterIsRateLimitedStub.calledOnceWith('call:1234567890')).to.be.true;
      expect(voiceCallLimiterIncrementRequestCountStub.notCalled).to.be.true;
      expect(axiosPostStub.notCalled).to.be.true;
    });

    it('should throw an error if axios request fails', async () => {
      voiceCallLimiterIsRateLimitedStub.resolves(false);
      axiosPostStub.rejects(new Error('Network error'));
      try {
        await voiceAgentIntegration.createCall('p123', '1234567890', 'Hello', 'US');
      } catch (error) {
        expect(error.message).to.equal('Failed to create call: Network error');
      }
      expect(voiceCallLimiterIsRateLimitedStub.calledOnceWith('call:1234567890')).to.be.true;
      expect(voiceCallLimiterIncrementRequestCountStub.calledOnceWith('call:1234567890')).to.be.true;
      expect(axiosPostStub.calledOnceWith('https://api.example.com/calls', {
        prospectId: 'p123',
        phoneNumber: '1234567890',
        script: 'Hello',
        country: 'US',
      }, {
        headers: {
          'Authorization': 'Bearer testApiKey',
          'Content-Type': 'application/json',
        },
      })).to.be.true;
    });
  });
});
