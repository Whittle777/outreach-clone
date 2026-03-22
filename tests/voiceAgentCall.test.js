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
const hitlWorkflow = require('../services/hitlWorkflow');
const NaturalLanguageGuardrails = require('../services/naturalLanguageGuardrails');
const DynamicKnowledgeGraphs = require('../services/dynamicKnowledgeGraphs');

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
  });

  // Other tests remain unchanged...
});
