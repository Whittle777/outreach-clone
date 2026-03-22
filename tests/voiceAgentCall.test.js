const VoiceAgentCall = require('../services/voiceAgentCall');
const config = require('../services/config').getConfig();
const AzureAcsCallAutomation = require('../services/azureAcsCallAutomation');
const TtsService = require('../services/ttsService');
const logger = require('../services/logger');
const doubleWriteStrategy = require('../services/doubleWriteStrategy');
const NGOE = require('../services/ngoe');
const { authenticateMcpToken } = require('../middleware/mcpAuth');
const SentimentAnalysisService = require('../services/sentimentAnalysis');
const VoiceAgentCallModel = require('../models/voiceAgentCall');
const temporalStateManager = require('../services/temporalStateManager');
const VoicemailScriptGenerator = require('../services/voicemailScriptGenerator');
const TimeBlockConfigModel = require('../models/timeBlockConfig');
const AzureServiceBus = require('../services/azureServiceBus');
const RabbitMQ = require('../services/rabbitMQ');

jest.mock('../services/azureAcsCallAutomation');
jest.mock('../services/ttsService');
jest.mock('../services/logger');
jest.mock('../services/doubleWriteStrategy');
jest.mock('../services/ngoe');
jest.mock('../middleware/mcpAuth');
jest.mock('../services/sentimentAnalysis');
jest.mock('../models/voiceAgentCall');
jest.mock('../services/temporalStateManager');
jest.mock('../services/voicemailScriptGenerator');
jest.mock('../models/timeBlockConfig');
jest.mock('../services/azureServiceBus');
jest.mock('../services/rabbitMQ');

describe('VoiceAgentCall', () => {
  let voiceAgentCall;

  beforeEach(() => {
    voiceAgentCall = new VoiceAgentCall('testApiKey');
  });

  describe('initiateCall', () => {
    it('should initiate a call with valid data', async () => {
      const callData = {
        phoneNumber: '1234567890',
        prospectData: { userId: 1 },
        voiceName: 'en-US-JennyNeural'
      };

      AzureAcsCallAutomation.prototype.initiateCall.mockResolvedValue();
      TtsService.prototype.generateAndStoreTtsAudio.mockResolvedValue();
      TimeBlockConfigModel.TimeBlockConfig.findUnique.mockResolvedValue({ daysOfWeek: [0], startTime: '09:00', endTime: '17:00' });

      await voiceAgentCall.initiateCall(callData);

      expect(AzureAcsCallAutomation.prototype.initiateCall).toHaveBeenCalledWith('1234567890', expect.any(String), expect.any(String));
      expect(TtsService.prototype.generateAndStoreTtsAudio).toHaveBeenCalledWith(expect.any(String), 'en-US-JennyNeural', expect.any(String));
    });

    it('should throw an error if call rate limit is exceeded', async () => {
      const callData = {
        phoneNumber: '1234567890',
        prospectData: { userId: 1 },
        voiceName: 'en-US-JennyNeural'
      };

      const req = { body: { phoneNumber: '1234567890' } };
      const res = { status: (code) => ({ json: (message) => { throw new Error(`${code}: ${message.error}`); } }) };
      const next = () => {};

      callRateLimiting(req, res, next);

      await expect(voiceAgentCall.initiateCall(callData)).rejects.toThrow('403: Call rate limit exceeded');
    });

    it('should throw an error if time is outside approved blocks', async () => {
      const callData = {
        phoneNumber: '1234567890',
        prospectData: { userId: 1 },
        voiceName: 'en-US-JennyNeural'
      };

      TimeBlockConfigModel.TimeBlockConfig.findUnique.mockResolvedValue({ daysOfWeek: [1], startTime: '09:00', endTime: '17:00' });

      await expect(voiceAgentCall.initiateCall(callData)).rejects.toThrow('Call initiation outside approved time blocks');
    });
  });

  describe('initiateVoicemailDrop', () => {
    it('should initiate a voicemail drop with valid data', async () => {
      const prospectData = { phoneNumber: '1234567890' };
      const audioFileUrl = 'http://example.com/audio.wav';

      AzureAcsCallAutomation.prototype.initiateVoicemailDrop.mockResolvedValue();

      await voiceAgentCall.initiateVoicemailDrop(prospectData, audioFileUrl);

      expect(AzureAcsCallAutomation.prototype.initiateVoicemailDrop).toHaveBeenCalledWith(prospectData, audioFileUrl);
    });
  });

  describe('handleRealTimeTranscript', () => {
    it('should handle real-time transcript with valid data', async () => {
      const transcriptData = { text: 'Hello, this is a test transcript.' };

      SentimentAnalysisService.prototype.analyze.mockResolvedValue({ sentiment: 'positive' });

      await voiceAgentCall.handleRealTimeTranscript(transcriptData);

      expect(SentimentAnalysisService.prototype.analyze).toHaveBeenCalledWith('Hello, this is a test transcript.');
      expect(logger.realTimeTranscript).toHaveBeenCalledWith(transcriptData);
    });
  });

  describe('predictQuarterlyPerformance', () => {
    it('should predict quarterly performance with valid data', async () => {
      const data = { userId: 1 };

      doubleWriteStrategy.predictQuarterlyPerformance.mockResolvedValue({ prediction: 'High' });

      const prediction = await voiceAgentCall.predictQuarterlyPerformance(data);

      expect(doubleWriteStrategy.predictQuarterlyPerformance).toHaveBeenCalledWith(data);
      expect(prediction).toEqual({ prediction: 'High' });
    });
  });

  describe('integrateWithNGOE', () => {
    it('should integrate with NGOE with valid data', async () => {
      const task = { type: 'testTask' };

      NGOE.prototype.executeTask.mockResolvedValue();

      await voiceAgentCall.integrateWithNGOE(task);

      expect(NGOE.prototype.executeTask).toHaveBeenCalledWith(task);
    });
  });

  describe('handleMcpRequest', () => {
    it('should handle MCP request with valid data', async () => {
      const req = { body: { data: { userId: 1 } } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await voiceAgentCall.handleMcpRequest(req, res);

      expect(authenticateMcpToken).toHaveBeenCalledWith(req, res, expect.any(Function));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'MCP request processed successfully' });
      expect(logger.info).toHaveBeenCalledWith('MCP request processed', { data: { userId: 1 } });
    });

    it('should handle MCP request with invalid token', async () => {
      const req = { body: { data: { userId: 1 } } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      authenticateMcpToken.mockImplementation((req, res, next) => {
        next(new Error('Invalid token'));
      });

      await voiceAgentCall.handleMcpRequest(req, res);

      expect(authenticateMcpToken).toHaveBeenCalledWith(req, res, expect.any(Function));
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
      expect(logger.error).toHaveBeenCalledWith('Error processing MCP request', { error: new Error('Invalid token') });
    });
  });

  describe('CRUD operations', () => {
    it('should create a VoiceAgentCall', async () => {
      const data = { phoneNumber: '1234567890' };

      VoiceAgentCallModel.VoiceAgentCall.create.mockResolvedValue({ id: 1, ...data });

      const createdCall = await voiceAgentCall.createVoiceAgentCall(data);

      expect(VoiceAgentCallModel.VoiceAgentCall.create).toHaveBeenCalledWith(data);
      expect(createdCall).toEqual({ id: 1, ...data });
    });

    it('should get all VoiceAgentCalls', async () => {
      const calls = [{ id: 1, phoneNumber: '1234567890' }];

      VoiceAgentCallModel.VoiceAgentCall.findMany.mockResolvedValue(calls);

      const retrievedCalls = await voiceAgentCall.getVoiceAgentCalls();

      expect(VoiceAgentCallModel.VoiceAgentCall.findMany).toHaveBeenCalled();
      expect(retrievedCalls).toEqual(calls);
    });

    it('should get a VoiceAgentCall by ID', async () => {
      const call = { id: 1, phoneNumber: '1234567890' };

      VoiceAgentCallModel.VoiceAgentCall.findUnique.mockResolvedValue(call);

      const retrievedCall = await voiceAgentCall.getVoiceAgentCallById(1);

      expect(VoiceAgentCallModel.VoiceAgentCall.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(retrievedCall).toEqual(call);
    });

    it('should update a VoiceAgentCall', async () => {
      const data = { phoneNumber: '0987654321' };

      VoiceAgentCallModel.VoiceAgentCall.update.mockResolvedValue({ id: 1, ...data });

      const updatedCall = await voiceAgentCall.updateVoiceAgentCall(1, data);

      expect(VoiceAgentCallModel.VoiceAgentCall.update).toHaveBeenCalledWith({ where: { id: 1 }, data });
      expect(updatedCall).toEqual({ id: 1, ...data });
    });

    it('should delete a VoiceAgentCall', async () => {
      const deletedCall = { id: 1, phoneNumber: '1234567890' };

      VoiceAgentCallModel.VoiceAgentCall.delete.mockResolvedValue(deletedCall);

      const result = await voiceAgentCall.deleteVoiceAgentCall(1);

      expect(VoiceAgentCallModel.VoiceAgentCall.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(deletedCall);
    });
  });

  describe('testEndToEndCallFlow', () => {
    it('should test end-to-end voice agent call flow with voicemail drop', async () => {
      const prospectData = { phoneNumber: '1234567890' };
      const voiceName = 'en-US-JennyNeural';

      VoicemailScriptGenerator.prototype.generateScript.mockResolvedValue('Test script');
      TtsService.prototype.generateAndStoreTtsAudio.mockResolvedValue();
      AzureAcsCallAutomation.prototype.initiateCall.mockResolvedValue();
      AzureAcsCallAutomation.prototype.initiateVoicemailDrop.mockResolvedValue();

      await voiceAgentCall.testEndToEndCallFlow(prospectData, voiceName);

      expect(VoicemailScriptGenerator.prototype.generateScript).toHaveBeenCalledWith(prospectData);
      expect(TtsService.prototype.generateAndStoreTtsAudio).toHaveBeenCalledWith('Test script', voiceName, expect.any(String));
      expect(AzureAcsCallAutomation.prototype.initiateCall).toHaveBeenCalledWith('1234567890', 'Test script', expect.any(String));
      expect(AzureAcsCallAutomation.prototype.initiateVoicemailDrop).toHaveBeenCalledWith(prospectData, expect.any(String));
    });
  });

  describe('sendMessageToQueue', () => {
    it('should send a message to the Azure Service Bus queue', async () => {
      const message = { type: 'testMessage' };

      AzureServiceBus.prototype.sendMessage.mockResolvedValue();

      await voiceAgentCall.sendMessageToQueue(message);

      expect(AzureServiceBus.prototype.sendMessage).toHaveBeenCalledWith(message);
    });
  });

  describe('sendMessageToRabbitMQ', () => {
    it('should send a message to the RabbitMQ queue', async () => {
      const message = { type: 'testMessage' };

      RabbitMQ.prototype.sendMessage.mockResolvedValue();

      await voiceAgentCall.sendMessageToRabbitMQ(message);

      expect(RabbitMQ.prototype.sendMessage).toHaveBeenCalledWith(message);
    });
  });
});
