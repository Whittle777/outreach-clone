const VoiceAgentCall = require('../services/voiceAgentCall');
const config = require('../services/config').getConfig();
const AzureAcsCallAutomation = require('../services/azureAcsCallAutomation');
const TtsService = require('../services/ttsService');
const logger = require('../services/logger');
const doubleWriteStrategy = require('../services/doubleWriteStrategy');
const NGOE = require('../services/ngoe');
const SentimentAnalysisService = require('../services/sentimentAnalysis');
const VoiceAgentCallModel = require('../models/voiceAgentCall');
const temporalStateManager = require('../services/temporalStateManager');
const VoicemailScriptGenerator = require('../services/voicemailScriptGenerator');
const TimeBlockConfigModel = require('../models/timeBlockConfig');
const AzureServiceBus = require('../services/azureServiceBus');
const RabbitMQ = require('../services/rabbitMQ');
const hitlWorkflow = require('../services/hitlWorkflow');
const NaturalLanguageGuardrails = require('../services/naturalLanguageGuardrails');
const DynamicKnowledgeGraphs = require('../services/dynamicKnowledgeGraphs');
const MicrosoftTeamsIntegration = require('../services/microsoftTeamsIntegration');

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
jest.mock('../services/hitlWorkflow');
jest.mock('../services/dynamicKnowledgeGraphs');
jest.mock('../services/naturalLanguageGuardrails');
jest.mock('../services/microsoftTeamsIntegration');

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
      NaturalLanguageGuardrails.prototype.enforcePolicyDirectives.mockResolvedValue();

      await voiceAgentCall.initiateCall(callData);

      expect(AzureAcsCallAutomation.prototype.initiateCall).toHaveBeenCalledWith('1234567890', expect.any(String), expect.any(String));
      expect(TtsService.prototype.generateAndStoreTtsAudio).toHaveBeenCalledWith(expect.any(String), 'en-US-JennyNeural', expect.any(String));
      expect(DynamicKnowledgeGraphs.addNode).toHaveBeenCalledWith(callData.prospectData);
      expect(NaturalLanguageGuardrails.prototype.enforcePolicyDirectives).toHaveBeenCalledWith(expect.any(String));
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

    it('should throw an error if natural language guardrails are violated', async () => {
      const callData = {
        phoneNumber: '1234567890',
        prospectData: { userId: 1 },
        voiceName: 'en-US-JennyNeural'
      };

      AzureAcsCallAutomation.prototype.initiateCall.mockResolvedValue();
      TtsService.prototype.generateAndStoreTtsAudio.mockResolvedValue();
      TimeBlockConfigModel.TimeBlockConfig.findUnique.mockResolvedValue({ daysOfWeek: [0], startTime: '09:00', endTime: '17:00' });
      NaturalLanguageGuardrails.prototype.enforcePolicyDirectives.mockImplementation(() => {
        throw new Error('Policy directive violation: No discounts');
      });

      await expect(voiceAgentCall.initiateCall(callData)).rejects.toThrow('Policy directive violation: No discounts');
    });

    it('should initiate a call with Microsoft Teams', async () => {
      const callData = {
        phoneNumber: '1234567890',
        prospectData: { userId: 1 },
        voiceName: 'en-US-JennyNeural',
        onBehalfOf: 'user@example.com',
        callType: 'microsoftTeams'
      };

      AzureAcsCallAutomation.prototype.initiateCall.mockResolvedValue();
      TtsService.prototype.generateAndStoreTtsAudio.mockResolvedValue();
      TimeBlockConfigModel.TimeBlockConfig.findUnique.mockResolvedValue({ daysOfWeek: [0], startTime: '09:00', endTime: '17:00' });
      NaturalLanguageGuardrails.prototype.enforcePolicyDirectives.mockResolvedValue();
      MicrosoftTeamsIntegration.prototype.sendInteractiveNotification.mockResolvedValue();

      await voiceAgentCall.initiateCall(callData);

      expect(AzureAcsCallAutomation.prototype.initiateCall).toHaveBeenCalledWith('1234567890', expect.any(String), expect.any(String), 'user@example.com');
      expect(TtsService.prototype.generateAndStoreTtsAudio).toHaveBeenCalledWith(expect.any(String), 'en-US-JennyNeural', expect.any(String));
      expect(DynamicKnowledgeGraphs.addNode).toHaveBeenCalledWith(callData.prospectData);
      expect(NaturalLanguageGuardrails.prototype.enforcePolicyDirectives).toHaveBeenCalledWith(expect.any(String));
      expect(MicrosoftTeamsIntegration.prototype.sendInteractiveNotification).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.any(Array));
    });
  });

  describe('version management', () => {
    it('should update version successfully', async () => {
      const newVersion = 'v2.0.0';
      await voiceAgentCall.updateVersion(newVersion);
      expect(temporalStateManager.saveCurrentVersion).toHaveBeenCalledWith(newVersion);
      expect(logger.versionChange).toHaveBeenCalledWith('Version updated successfully', { newVersion });
    });

    it('should throw an error on version mismatch', async () => {
      const currentVersion = 'v1.0.0';
      temporalStateManager.loadCurrentVersion.mockReturnValue(currentVersion);
      const newVersion = 'v2.0.0';
      await expect(voiceAgentCall.updateVersion(newVersion)).rejects.toThrow('Version mismatch detected');
      expect(logger.warn).toHaveBeenCalledWith('Version mismatch detected', { currentVersion, newVersion });
    });

    it('should roll back version successfully', async () => {
      const currentVersion = 'v1.0.0';
      temporalStateManager.loadCurrentVersion.mockReturnValue(currentVersion);
      await voiceAgentCall.rollbackVersion();
      expect(temporalStateManager.clearCurrentVersion).toHaveBeenCalled();
      expect(logger.versionChange).toHaveBeenCalledWith('Version rolled back successfully', { currentVersion });
    });

    it('should log no version to roll back', async () => {
      temporalStateManager.loadCurrentVersion.mockReturnValue(null);
      await voiceAgentCall.rollbackVersion();
      expect(logger.warn).toHaveBeenCalledWith('No version to roll back');
    });
  });
});
