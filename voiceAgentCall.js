const config = require('../services/config').getConfig();
const callRateLimiting = require('../middleware/callRateLimiting');
const AzureAcsCallAutomation = require('./azureAcsCallAutomation');
const TtsService = require('./ttsService');
const logger = require('../services/logger');
const doubleWriteStrategy = require('./doubleWriteStrategy');
const NGOE = require('./ngoe');
const SentimentAnalysisService = require('./sentimentAnalysis');
const VoiceAgentCallModel = require('../models/voiceAgentCall');
const temporalStateManager = require('../services/temporalStateManager');
const VoicemailScriptGenerator = require('./voicemailScriptGenerator');
const TimeBlockConfigModel = require('../models/timeBlockConfig');
const AzureServiceBus = require('../services/azureServiceBus');
const RabbitMQ = require('../services/rabbitMQ');
const path = require('path');
const axios = require('axios');

class VoiceAgentCall {
  constructor(apiKey) {
    this.azureAcsCallAutomation = new AzureAcsCallAutomation(config.azureAcsConnectionString, config.azureAcsQueueName);
    this.ttsService = new TtsService(config.azureSpeechApiKey, config.azureSpeechRegion);
    this.ngoe = new NGOE();
    this.sentimentAnalysisService = new SentimentAnalysisService(apiKey);
    this.voicemailScriptGenerator = new VoicemailScriptGenerator();
    this.azureServiceBus = new AzureServiceBus(config.azureServiceBusConnectionString, config.azureServiceBusQueueName);
    this.rabbitMQ = new RabbitMQ(config.rabbitmqUrl, config.rabbitmqQueueName);
  }

  async initiateCall(callData) {
    const { phoneNumber, prospectData, voiceName, onBehalfOf, callType } = callData;

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

    // Analyze sentiment of the transcript
    try {
      const sentimentResult = await this.sentimentAnalysisService.analyze(transcriptData.text);
      logger.log('Sentiment analysis successful', { sentimentResult });
      this.emitSentimentAnalysisResult(sentimentResult);
    } catch (error) {
      logger.error('Error analyzing sentiment', error);
    }
  }

  emitSentimentAnalysisResult(sentimentResult) {
    const { message, data } = sentimentResult;
    logger.log('sentimentAnalysisResult', { message, data });
  }

  // Other methods remain unchanged...
}

module.exports = VoiceAgentCall;
