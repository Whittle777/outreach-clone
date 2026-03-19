const assert = require('assert');
const sinon = require('sinon');
const VoiceAgentCall = require('../models/VoiceAgentCall');
const MessageBroker = require('../messageBroker');
const config = require('../config/settings');
const logger = require('../services/logger');
const rateLimiter = require('../services/rateLimiter');

describe('Detection System', function() {
  let messageBroker;
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    messageBroker = new MessageBroker(config);
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('detectResistanceOrRegulatoryEdgeCases', function() {
    it('should detect resistance keywords in call transcript', async function() {
      const callTranscript = 'The prospect is busy and unavailable.';
      const result = await VoiceAgentCall.detectResistanceOrRegulatoryEdgeCases({ callTranscript });
      assert.strictEqual(result, true);
    });

    it('should not detect resistance keywords in call transcript', async function() {
      const callTranscript = 'The prospect is available and interested.';
      const result = await VoiceAgentCall.detectResistanceOrRegulatoryEdgeCases({ callTranscript });
      assert.strictEqual(result, false);
    });
  });

  describe('sendMessage', function() {
    it('should throw an error if rate limit is exceeded', async function() {
      const message = { id: '123', phoneNumber: '1234567890' };
      sandbox.stub(rateLimiter, 'isRateLimited').resolves(true);

      try {
        await messageBroker.sendMessage(message);
        assert.fail('Expected an error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Rate limit exceeded');
      }
    });

    it('should send a message if rate limit is not exceeded', async function() {
      const message = { id: '123', phoneNumber: '1234567890' };
      sandbox.stub(rateLimiter, 'isRateLimited').resolves(false);
      sandbox.stub(messageBroker.broker, 'sendMessage').resolves('Message sent');

      const result = await messageBroker.sendMessage(message);
      assert.strictEqual(result, 'Message sent');
    });
  });

  describe('handleMessage', function() {
    it('should update VoiceAgentCall state to "Failed"', async function() {
      const message = { prospectId: '123', phoneNumber: '1234567890' };
      sandbox.stub(VoiceAgentCall, 'update').resolves();
      sandbox.stub(messageBroker, 'captureTranscript').resolves('Transcript content');
      sandbox.stub(messageBroker, 'storeTranscript').resolves();
      sandbox.stub(messageBroker.sentimentAnalysisService, 'analyze').resolves({ score: 0.5, label: 'Neutral' });
      sandbox.stub(messageBroker, 'storeSentimentAnalysis').resolves();

      await messageBroker.handleMessage(message);

      sinon.assert.calledOnceWithExactly(VoiceAgentCall.update, '123', { callStatus: 'Failed' });
    });

    it('should log the updated VoiceAgentCall state', async function() {
      const message = { prospectId: '123', phoneNumber: '1234567890' };
      sandbox.stub(VoiceAgentCall, 'update').resolves();
      sandbox.stub(messageBroker, 'captureTranscript').resolves('Transcript content');
      sandbox.stub(messageBroker, 'storeTranscript').resolves();
      sandbox.stub(messageBroker.sentimentAnalysisService, 'analyze').resolves({ score: 0.5, label: 'Neutral' });
      sandbox.stub(messageBroker, 'storeSentimentAnalysis').resolves();
      sandbox.stub(logger, 'log');

      await messageBroker.handleMessage(message);

      sinon.assert.calledOnceWithExactly(logger.log, `Updated VoiceAgentCall state to 'Failed' for prospectId: 123`);
    });
  });
});
