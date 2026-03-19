const MessageBroker = require('../messageBroker');
const azureServiceBus = require('../messageBroker/azureServiceBus');
const awsSqs = require('../messageBroker/awsSqs');
const rabbitMQ = require('../messageBroker/rabbitMQ');
const rateLimiter = require('../services/rateLimiter');
const logger = require('../services/logger');
const config = require('../config/settings');
const VoiceAgentCall = require('../models/VoiceAgentCall');
const SentimentAnalysis = require('../services/sentimentAnalysis');
const wss = require('../server').wss;

jest.mock('../messageBroker/azureServiceBus');
jest.mock('../messageBroker/awsSqs');
jest.mock('../messageBroker/rabbitMQ');
jest.mock('../services/rateLimiter');
jest.mock('../services/logger');
jest.mock('../models/VoiceAgentCall');
jest.mock('../services/sentimentAnalysis');
jest.mock('../server');

describe('MessageBroker', () => {
  let messageBroker;

  beforeEach(() => {
    config.messageBroker = 'azure-service-bus';
    messageBroker = new MessageBroker(config);
  });

  describe('sendMessage', () => {
    it('should send a message if rate limit is not exceeded', async () => {
      const message = {
        id: 1,
        phoneNumber: '1234567890',
      };

      rateLimiter.isRateLimited.mockResolvedValue(false);
      rateLimiter.incrementRequestCount.mockResolvedValue(1);
      azureServiceBus.sendMessage.mockResolvedValue('Message sent');

      const result = await messageBroker.sendMessage(message);

      expect(result).toBe('Message sent');
      expect(rateLimiter.isRateLimited).toHaveBeenCalledWith(`message:${message.id}:${message.phoneNumber}`, 10);
      expect(rateLimiter.incrementRequestCount).toHaveBeenCalledWith(`message:${message.id}:${message.phoneNumber}`);
      expect(azureServiceBus.sendMessage).toHaveBeenCalledWith(message);
    });

    it('should throw an error if rate limit is exceeded', async () => {
      const message = {
        id: 1,
        phoneNumber: '1234567890',
      };

      rateLimiter.isRateLimited.mockResolvedValue(true);

      await expect(messageBroker.sendMessage(message)).rejects.toThrow('Rate limit exceeded');
      expect(rateLimiter.isRateLimited).toHaveBeenCalledWith(`message:${message.id}:${message.phoneNumber}`, 10);
    });
  });

  describe('receiveMessage', () => {
    it('should receive a message and handle it', async () => {
      const message = {
        id: 1,
        phoneNumber: '1234567890',
        prospectId: 1,
      };

      azureServiceBus.receiveMessage.mockResolvedValue(message);
      VoiceAgentCall.update.mockResolvedValue();
      captureTranscript.mockResolvedValue('Transcript text');
      storeTranscript.mockResolvedValue();
      storeSentimentAnalysis.mockResolvedValue();

      await messageBroker.receiveMessage();

      expect(azureServiceBus.receiveMessage).toHaveBeenCalled();
      expect(VoiceAgentCall.update).toHaveBeenCalledWith(message.prospectId, { callStatus: 'Failed' });
      expect(captureTranscript).toHaveBeenCalledWith(message.prospectId);
      expect(storeTranscript).toHaveBeenCalledWith(message.prospectId, 'Transcript text');
      expect(storeSentimentAnalysis).toHaveBeenCalled();
      expect(wss.clients.forEach).toHaveBeenCalled();
    });

    it('should return null if no message is received', async () => {
      azureServiceBus.receiveMessage.mockResolvedValue(null);

      const result = await messageBroker.receiveMessage();

      expect(result).toBeNull();
      expect(azureServiceBus.receiveMessage).toHaveBeenCalled();
    });
  });
});
