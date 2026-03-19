const MessageBroker = require('./messageBroker');
const azureServiceBus = require('./messageBroker/azureServiceBus');
const awsSqs = require('./messageBroker/awsSqs');
const rabbitMQ = require('./messageBroker/rabbitMQ');
const rateLimiter = require('../services/rateLimiter');
const logger = require('../services/logger');
const config = require('../config/settings');
const VoiceAgentCall = require('../models/VoiceAgentCall');
const SentimentAnalysis = require('../services/sentimentAnalysis');
const wss = require('../server').wss;
const jwt = require('jsonwebtoken');
const AIGenerator = require('../services/aiGenerator');
const NGOE = require('../services/ngoeTaskExecutor');
const MCPGateway = require('./messageBroker/mcpGateway');
const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');
const AwsSqsConsumer = require('./messageBroker/awsSqsConsumer');

jest.mock('./messageBroker/azureServiceBus');
jest.mock('./messageBroker/awsSqs');
jest.mock('./messageBroker/rabbitMQ');
jest.mock('../services/rateLimiter');
jest.mock('../services/logger');
jest.mock('../config/settings');
jest.mock('../models/VoiceAgentCall');
jest.mock('../services/sentimentAnalysis');
jest.mock('../server');
jest.mock('jsonwebtoken');
jest.mock('../services/aiGenerator');
jest.mock('../services/ngoeTaskExecutor');
jest.mock('./messageBroker/mcpGateway');
jest.mock('crypto');
jest.mock('express');
jest.mock('body-parser');
jest.mock('./messageBroker/awsSqsConsumer');

describe('MessageBroker', () => {
  let messageBroker;

  beforeEach(() => {
    messageBroker = new MessageBroker({
      messageBroker: 'azure-service-bus',
      azureServiceBus: { connectionString: 'test-connection-string', topicName: 'test-topic' },
      awsSqs: { url: 'test-url' },
      rabbitMQ: { url: 'test-url', queueName: 'test-queue' }
    });
  });

  describe('initBroker', () => {
    it('should initialize Azure Service Bus broker', () => {
      messageBroker = new MessageBroker({
        messageBroker: 'azure-service-bus',
        azureServiceBus: { connectionString: 'test-connection-string', topicName: 'test-topic' }
      });
      expect(messageBroker.broker).toBeInstanceOf(azureServiceBus);
    });

    it('should initialize AWS SQS broker', () => {
      messageBroker = new MessageBroker({
        messageBroker: 'aws-sqs',
        awsSqs: { url: 'test-url' }
      });
      expect(messageBroker.broker).toBeInstanceOf(awsSqs);
    });

    it('should initialize RabbitMQ broker', () => {
      messageBroker = new MessageBroker({
        messageBroker: 'rabbitmq',
        rabbitMQ: { url: 'test-url', queueName: 'test-queue' }
      });
      expect(messageBroker.broker).toBeInstanceOf(rabbitMQ);
    });

    it('should throw an error for unsupported message broker', () => {
      expect(() => {
        messageBroker = new MessageBroker({
          messageBroker: 'unsupported-broker'
        });
      }).toThrow('Unsupported message broker');
    });
  });

  describe('sendMessage', () => {
    it('should call sendMessage on the broker', async () => {
      const message = 'test-message';
      await messageBroker.sendMessage(message);
      expect(messageBroker.broker.sendMessage).toHaveBeenCalledWith(message);
    });

    it('should call sendMessage on the fallback broker if primary broker fails', async () => {
      const message = 'test-message';
      messageBroker.broker.sendMessage.mockRejectedValue(new Error('Primary broker failed'));
      await messageBroker.sendMessage(message);
      expect(messageBroker.fallbackBroker.sendMessage).toHaveBeenCalledWith(message);
    });
  });

  describe('receiveMessage', () => {
    it('should call receiveMessage on the broker', async () => {
      await messageBroker.receiveMessage();
      expect(messageBroker.broker.receiveMessage).toHaveBeenCalled();
    });

    it('should call receiveMessage on the fallback broker if primary broker fails', async () => {
      messageBroker.broker.receiveMessage.mockRejectedValue(new Error('Primary broker failed'));
      await messageBroker.receiveMessage();
      expect(messageBroker.fallbackBroker.receiveMessage).toHaveBeenCalled();
    });
  });

  describe('handleMessage', () => {
    it('should update VoiceAgentCall state to Failed', async () => {
      const message = { prospectId: '123', phoneNumber: '1234567890', confidenceScore: 90 };
      await messageBroker.handleMessage(message);
      expect(VoiceAgentCall.update).toHaveBeenCalledWith('123', { callStatus: 'Failed' });
    });

    it('should capture and store real-time text transcript', async () => {
      const message = { prospectId: '123', phoneNumber: '1234567890', confidenceScore: 90 };
      const transcript = 'test transcript';
      VoiceAgentCall.update.mockResolvedValueOnce();
      await messageBroker.handleMessage(message);
      expect(storeTranscript).toHaveBeenCalledWith('123', transcript);
    });

    it('should perform sentiment analysis', async () => {
      const message = { prospectId: '123', phoneNumber: '1234567890', confidenceScore: 90 };
      const transcript = 'test transcript';
      VoiceAgentCall.update.mockResolvedValueOnce();
      storeTranscript.mockResolvedValueOnce();
      await messageBroker.handleMessage(message);
      expect(SentimentAnalysis.analyze).toHaveBeenCalledWith(transcript);
    });

    it('should store sentiment analysis results in the database', async () => {
      const message = { prospectId: '123', phoneNumber: '1234567890', confidenceScore: 90 };
      const transcript = 'test transcript';
      const sentimentData = { score: 0.8, label: 'positive' };
      VoiceAgentCall.update.mockResolvedValueOnce();
      storeTranscript.mockResolvedValueOnce();
      SentimentAnalysis.analyze.mockResolvedValueOnce(sentimentData);
      await messageBroker.handleMessage(message);
      expect(storeSentimentAnalysis).toHaveBeenCalledWith('123', 0.8, 'positive', { source: 'sentiment-analysis-service' }, 'country', 'region');
    });

    it('should send real-time update to frontend', async () => {
      const message = { prospectId: '123', phoneNumber: '1234567890', confidenceScore: 90 };
      VoiceAgentCall.update.mockResolvedValueOnce();
      storeTranscript.mockResolvedValueOnce();
      SentimentAnalysis.analyze.mockResolvedValueOnce();
      await messageBroker.handleMessage(message);
      expect(wss.clients.forEach).toHaveBeenCalled();
    });

    it('should detect and flag resistance or regulatory edge cases', async () => {
      const message = { prospectId: '123', phoneNumber: '1234567890', confidenceScore: 90 };
      const transcript = 'test transcript';
      VoiceAgentCall.update.mockResolvedValueOnce();
      storeTranscript.mockResolvedValueOnce();
      SentimentAnalysis.analyze.mockResolvedValueOnce();
      await messageBroker.handleMessage(message);
      expect(VoiceAgentCall.detectResistanceOrRegulatoryEdgeCase).toHaveBeenCalledWith('123', transcript);
    });

    it('should route message based on confidence score', async () => {
      const message = { prospectId: '123', phoneNumber: '1234567890', confidenceScore: 90 };
      VoiceAgentCall.update.mockResolvedValueOnce();
      storeTranscript.mockResolvedValueOnce();
      SentimentAnalysis.analyze.mockResolvedValueOnce();
      await messageBroker.handleMessage(message);
      expect(AIGenerator.executeAI).toHaveBeenCalledWith('123', transcript);
    });
  });

  describe('isRateLimited', () => {
    it('should check if the request is rate limited', async () => {
      const key = 'test-key';
      const limit = 10;
      await messageBroker.isRateLimited(key, limit);
      expect(rateLimiter.isRateLimited).toHaveBeenCalledWith(key, limit);
    });
  });

  describe('incrementRequestCount', () => {
    it('should increment the request count', async () => {
      const key = 'test-key';
      await messageBroker.incrementRequestCount(key);
      expect(rateLimiter.incrementRequestCount).toHaveBeenCalledWith(key);
    });
  });

  describe('getRateLimitForPhoneNumber', () => {
    it('should return the rate limit for a phone number', () => {
      const phoneNumber = '1234567890';
      const rateLimitConfig = { limit: 5 };
      config.rateLimits.teamsPhoneNumbers[phoneNumber] = rateLimitConfig;
      expect(messageBroker.getRateLimitForPhoneNumber(phoneNumber)).toBe(5);
    });

    it('should return the default rate limit if no specific configuration is found', () => {
      const phoneNumber = '1234567890';
      expect(messageBroker.getRateLimitForPhoneNumber(phoneNumber)).toBe(10);
    });
  });

  describe('fetchActiveConstraints', () => {
    it('should fetch active constraints from the broker', async () => {
      const token = 'test-token';
      const decoded = { isFleetCommandCenterUser: true };
      jwt.verify.mockResolvedValue(decoded);
      await messageBroker.fetchActiveConstraints(token);
      expect(messageBroker.broker.fetchActiveConstraints).toHaveBeenCalledWith(token);
    });

    it('should throw an error if the token is invalid', async () => {
      const token = 'test-token';
      const decoded = { isFleetCommandCenterUser: false };
      jwt.verify.mockResolvedValue(decoded);
      await expect(messageBroker.fetchActiveConstraints(token)).rejects.toThrow('Unauthorized access');
    });
  });

  describe('executeNGOETask', () => {
    it('should execute an NGOE task', async () => {
      const task = { name: 'test-task' };
      await messageBroker.executeNGOETask(task);
      expect(messageBroker.ngoe.executeTask).toHaveBeenCalledWith(task);
    });
  });

  describe('sendMCPMessage', () => {
    it('should send a message through the MCP Gateway', async () => {
      const message = { content: 'test-message' };
      const encryptedMessage = 'encrypted-message';
      crypto.createCipher.mockReturnValue({ update: jest.fn().mockReturnValue(encryptedMessage), final: jest.fn().mockReturnValue('') });
      await messageBroker.sendMCPMessage(message);
      expect(messageBroker.mcpGateway.sendMessage).toHaveBeenCalledWith(encryptedMessage);
    });
  });

  describe('receiveMCPMessage', () => {
    it('should receive a message from the MCP Gateway', async () => {
      const encryptedMessage = 'encrypted-message';
      const decryptedMessage = 'decrypted-message';
      crypto.createDecipher.mockReturnValue({ update: jest.fn().mockReturnValue(decryptedMessage), final: jest.fn().mockReturnValue('') });
      await messageBroker.receiveMCPMessage(encryptedMessage);
      expect(messageBroker.mcpGateway.receiveMessage).toHaveBeenCalledWith(decryptedMessage);
    });
  });

  describe('handleMCPMessage', () => {
    it('should handle a message received from the MCP Gateway', async () => {
      const message = { content: 'test-message' };
      await messageBroker.handleMCPMessage(message);
      expect(messageBroker.aiGenerator.processMessage).toHaveBeenCalledWith(message);
    });
  });

  describe('isGDPRCompliant', () => {
    it('should check if the data is GDPR compliant', async () => {
      const prospectId = '123';
      const callStatus = 'Failed';
      const preGeneratedScript = 'test script';
      const ttsAudioFileUrl = 'test-url';
      const callTranscript = 'test transcript';
      await messageBroker.isGDPRCompliant(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript);
      expect(messageBroker.isGDPRCompliant).toHaveBeenCalledWith(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript);
    });
  });

  describe('makeOutboundCall', () => {
    it('should make an outbound call', async () => {
      const phoneNumber = '1234567890';
      const callData = { callId: '123' };
      azureServiceBus.createCall.mockResolvedValueOnce(callData);
      await messageBroker.makeOutboundCall(phoneNumber);
      expect(azureServiceBus.createCall).toHaveBeenCalledWith(phoneNumber);
    });
  });

  describe('handleVoicemailDrop', () => {
    it('should handle voicemail drop', async () => {
      const prospectId = '123';
      const phoneNumber = '1234567890';
      const message = 'test message';
      const token = 'test-token';
      await messageBroker.handleVoicemailDrop(prospectId, phoneNumber, message, token);
      expect(messageBroker.broker.handleVoicemailDrop).toHaveBeenCalledWith(prospectId, phoneNumber, message, token);
    });
  });

  describe('startAwsSqsConsumer', () => {
    it('should start the AWS SQS consumer', () => {
      messageBroker.startAwsSqsConsumer();
      expect(messageBroker.awsSqsConsumer.startConsuming).toHaveBeenCalled();
    });
  });
});
