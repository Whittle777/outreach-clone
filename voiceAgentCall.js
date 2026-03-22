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
const NLP = require('../services/nlp');
const IntentDrivenShortcuts = require('../services/intentDrivenShortcuts');
const AzureSpeechService = require('./azureSpeechService'); // New service for transcription
const DynamicKnowledgeGraphs = require('../services/dynamicKnowledgeGraphs');

class VoiceAgentCall {
  constructor(apiKey) {
    this.azureAcsCallAutomation = new AzureAcsCallAutomation(config.azureAcsConnectionString, config.azureAcsQueueName);
    this.ttsService = new TtsService(config.azureSpeechApiKey, config.azureSpeechRegion);
    this.ngoe = new NGOE();
    this.sentimentAnalysisService = new SentimentAnalysisService(apiKey);
    this.voicemailScriptGenerator = new VoicemailScriptGenerator();
    this.azureServiceBus = new AzureServiceBus(config.azureServiceBusConnectionString, config.azureServiceBusQueueName);
    this.rabbitMQ = new RabbitMQ(config.rabbitmqUrl, config.rabbitmqQueueName);
    this.nlp = new NLP(config);
    this.intentDrivenShortcuts = new IntentDrivenShortcuts(config);
    this.azureSpeechService = new AzureSpeechService(config.azureSpeechApiKey, config.azureSpeechRegion); // Initialize transcription service
    this.dynamicKnowledgeGraphs = new DynamicKnowledgeGraphs();
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

    // Start transcription
    try {
      const transcriptionStream = await this.azureSpeechService.startTranscription(outputFilePath);
      transcriptionStream.on('data', (data) => {
        logger.realTimeTranscript('Transcription data received', { data });
      });
      transcriptionStream.on('error', (error) => {
        logger.error('Error in transcription', { error });
      });
      transcriptionStream.on('end', () => {
        logger.info('Transcription ended');
      });
    } catch (error) {
      logger.error('Error starting transcription', { error });
    }

    // Analyze sentiment of the transcript in parallel
    try {
      const sentimentAnalysisPromise = this.sentimentAnalysisService.analyze(transcriptData.text);
      const [sentimentResult] = await Promise.all([sentimentAnalysisPromise]);
      logger.log('Sentiment analysis successful', { sentimentResult });
      this.emitSentimentAnalysisResult(sentimentResult);
    } catch (error) {
      logger.error('Error analyzing sentiment', error);
    }

    // Log real-time reasoning
    try {
      const reasoningLog = {
        step: 'initiateCall',
        action: 'call initiated',
        data: { phoneNumber, onBehalfOf, callType },
      };
      logger.realTimeReasoningLog('Real-time reasoning log', { reasoningLog });
    } catch (error) {
      logger.error('Error logging real-time reasoning', { error });
    }

    // Add prospect to dynamic knowledge graph
    this.dynamicKnowledgeGraphs.addNode(prospectData);
  }

  async parseUserPrompt(prompt) {
    try {
      const parsedData = await this.nlp.parsePrompt(prompt);
      logger.info('User prompt parsed', { prompt, parsedData });
      return parsedData;
    } catch (error) {
      logger.error('Error parsing user prompt', { prompt, error });
      throw error;
    }
  }

  emitSentimentAnalysisResult(sentimentResult) {
    const { message, data } = sentimentResult;
    logger.log('sentimentAnalysisResult', { message, data });
  }

  async handleIntent(intent, data) {
    try {
      const result = await this.intentDrivenShortcuts.handleIntent(intent, data);
      logger.intentHandled('Intent handled successfully', { intent, result });
      return result;
    } catch (error) {
      logger.error('Error handling intent', { intent, error });
      throw error;
    }
  }

  async performPredictiveSearch(query) {
    try {
      const result = await this.intentDrivenShortcuts.predictSearch(query);
      logger.predictiveSearchResult('Predictive search successful', { query, result });
      return result;
    } catch (error) {
      logger.error('Error performing predictive search', { query, error });
      throw error;
    }
  }

  isTimeWithinApprovedBlocks(timeBlockConfig) {
    // Implementation to check if the current time is within the approved time blocks
    // This is a placeholder implementation
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    return timeBlockConfig.daysOfWeek.includes(dayOfWeek) && timeBlockConfig.startTime <= hour && hour < timeBlockConfig.endTime;
  }

  // New method to detect resistance or regulatory edge cases
  detectResistanceOrRegulatoryEdgeCases(transcriptData) {
    // Placeholder logic for detecting resistance or regulatory edge cases
    const resistanceKeywords = ['resistance', 'regulatory', 'edge', 'case'];
    const transcriptText = transcriptData.text.toLowerCase();
    const hasResistanceKeyword = resistanceKeywords.some(keyword => transcriptText.includes(keyword));

    if (hasResistanceKeyword) {
      logger.visualFlag('Resistance or regulatory edge case detected', { transcriptData });
    }
  }
}

module.exports = VoiceAgentCall;
