const config = require('../services/config').getConfig();
const callRateLimiting = require('../middleware/callRateLimiting');
const AzureAcsCallAutomation = require('./azureAcsCallAutomation');
const TtsService = require('./ttsService');
const logger = require('../services/logger');
const doubleWriteStrategy = require('./doubleWriteStrategy');
const NGOE = require('./ngoe');
const { authenticateMcpToken } = require('../middleware/mcpAuth');
const SentimentAnalysisService = require('./sentimentAnalysisService');
const VoiceAgentCallModel = require('../models/voiceAgentCall');
const temporalStateManager = require('../services/temporalStateManager');
const VoicemailScriptGenerator = require('./voicemailScriptGenerator');
const TimeBlockConfigModel = require('../models/timeBlockConfig');
const AzureServiceBus = require('../services/azureServiceBus');
const RabbitMQ = require('../services/rabbitMQ');
const path = require('path');
const axios = require('axios');
const { promisify } = require('util');
const parallel = require('async/parallel');
const DetectionService = require('./detectionService');
const PredictiveSearch = require('./predictiveSearch');
const WebSocket = require('ws');
const hitlWorkflow = require('../services/hitlWorkflow');
const NaturalLanguageGuardrails = require('./naturalLanguageGuardrails');
const slackIntegration = require('../services/slackIntegration');

class VoiceAgentCall {
  constructor(apiKey) {
    this.azureAcsCallAutomation = new AzureAcsCallAutomation(config.azureAcsConnectionString, config.azureAcsQueueName);
    this.ttsService = new TtsService(config.azureSpeechApiKey, config.azureSpeechRegion);
    this.ngoe = new NGOE();
    this.sentimentAnalysisService = new SentimentAnalysisService(apiKey);
    this.voicemailScriptGenerator = new VoicemailScriptGenerator();
    this.azureServiceBus = new AzureServiceBus(config.azureServiceBusConnectionString, config.azureServiceBusQueueName);
    this.rabbitMQ = new RabbitMQ(config.rabbitmqUrl, config.rabbitmqQueueName);
    this.detectionService = new DetectionService();
    this.predictiveSearch = new PredictiveSearch(config);
    this.wss = new WebSocket.Server({ port: 8080 });
    this.naturalLanguageGuardrails = new NaturalLanguageGuardrails();
  }

  async initiateCall(callData) {
    const { phoneNumber, prospectData, voiceName, onBehalfOf, callType, callFlags } = callData;

    // Apply call rate limiting middleware
    const req = { body: { phoneNumber, callType } };
    const res = { status: (code) => ({ json: (message) => { throw new Error(`${code}: ${message.error}`); } }) };
    const next = () => {};

    try {
      callRateLimiting(req, res, next);
    } catch (error) {
      logger.error('Call rate limit exceeded', { error, phoneNumber, callType });
      throw error;
    }

    // Check time block configuration
    const timeBlockConfig = await TimeBlockConfigModel.TimeBlockConfig.findUnique({ where: { userId: prospectData.userId } });
    if (!this.isTimeWithinApprovedBlocks(timeBlockConfig)) {
      logger.warn('Call initiation outside approved time blocks', { phoneNumber, callType });
      throw new Error('Call initiation outside approved time blocks');
    }

    // Generate voicemail script
    const script = this.voicemailScriptGenerator.generateScript(prospectData);
    logger.info('Voicemail script generated', { script, phoneNumber, callType });

    // Enforce natural language guardrails
    this.naturalLanguageGuardrails.enforcePolicyDirectives(script);

    // Generate TTS audio file
    const outputFilePath = path.join(__dirname, `../temp/${phoneNumber}_tts.wav`);
    try {
      await this.ttsService.generateAndStoreTtsAudio(script, voiceName, outputFilePath);
      logger.info('TTS audio file generated', { phoneNumber, outputFilePath, callType });
    } catch (error) {
      logger.error('Error generating TTS audio file', { error, phoneNumber, callType });
      throw error;
    }

    // Proceed with initiating the call
    try {
      await this.azureAcsCallAutomation.initiateCall(phoneNumber, script, outputFilePath, onBehalfOf);
      logger.info('Call initiated', { phoneNumber, onBehalfOf, callType });
    } catch (error) {
      logger.error('Error initiating call', { error, phoneNumber, onBehalfOf, callType });
      throw error;
    }

    // Store the call with CallFlags using double-write strategy
    try {
      const callDataWithFlags = {
        phoneNumber,
        prospectData,
        voiceName,
        onBehalfOf,
        callType,
        callFlags,
      };

      await doubleWriteStrategy.write(callDataWithFlags);
      logger.info('VoiceAgentCall created with CallFlags using double-write strategy', { callDataWithFlags });
      this.broadcastCallUpdate(callDataWithFlags);

      // Send interactive notification for approval workflow
      const actions = [
        {
          name: "approve",
          text: "Approve",
          type: "button",
          value: "approve"
        },
        {
          name: "reject",
          text: "Reject",
          type: "button",
          value: "reject"
        }
      ];

      await slackIntegration.sendInteractiveNotification('#approval-channel', `New call initiated for ${prospectData.name}`, actions);
    } catch (error) {
      logger.error('Error creating VoiceAgentCall with CallFlags using double-write strategy', { error, callData });
      throw error;
    }
  }

  // Other methods remain unchanged...
}

module.exports = VoiceAgentCall;
