const config = require('../services/config').getConfig();
const callRateLimiting = require('../middleware/callRateLimiting');
const AzureAcsCallAutomation = require('./azureAcsCallAutomation');
const TtsService = require('./ttsService');
const logger = require('../services/logger');
const doubleWriteStrategy = require('./doubleWriteStrategy');
const NGOE = require('./ngoe');
const { authenticateMcpToken } = require('../middleware/mcpAuth');
const SentimentAnalysisService = require('./sentimentAnalysis');
const VoiceAgentCallModel = require('../models/voiceAgentCall');

class VoiceAgentCall {
  constructor(apiKey) {
    this.azureAcsCallAutomation = new AzureAcsCallAutomation(config.azureAcsConnectionString, config.azureAcsQueueName);
    this.ttsService = new TtsService(config.azureSpeechApiKey, config.azureSpeechRegion);
    this.ngoe = new NGOE();
    this.sentimentAnalysisService = new SentimentAnalysisService(apiKey);
  }

  async initiateCall(callData) {
    const { phoneNumber, script, voiceName } = callData;

    // Apply call rate limiting middleware
    const req = { body: { phoneNumber } };
    const res = { status: (code) => ({ json: (message) => { throw new Error(`${code}: ${message.error}`); } }) };
    const next = () => {};

    try {
      callRateLimiting(req, res, next);
    } catch (error) {
      throw error;
    }

    // Generate TTS audio file
    const outputFilePath = path.join(__dirname, `../temp/${phoneNumber}_tts.wav`);
    await this.ttsService.generateAndStoreTtsAudio(script, voiceName, outputFilePath);

    // Proceed with initiating the call
    await this.azureAcsCallAutomation.createCall(phoneNumber, script, outputFilePath);
  }

  async handleRealTimeTranscript(transcriptData) {
    // Log the real-time transcript
    logger.realTimeTranscript(transcriptData);

    // Analyze sentiment of the transcript
    try {
      const sentimentResult = await this.sentimentAnalysisService.analyze(transcriptData.text);
      logger.log('Sentiment analysis successful', { sentimentResult });
    } catch (error) {
      logger.error('Error analyzing sentiment', error);
    }
  }

  async predictQuarterlyPerformance(data) {
    try {
      const prediction = await doubleWriteStrategy.predictQuarterlyPerformance(data);
      logger.log('Quarterly performance prediction successful', { prediction });
      return prediction;
    } catch (error) {
      logger.error('Error predicting quarterly performance', error);
      throw error;
    }
  }

  async integrateWithNGOE(task) {
    try {
      await this.ngoe.executeTask(task);
      logger.log('Task integrated with NGOE successfully', { task });
    } catch (error) {
      logger.error('Error integrating task with NGOE', error);
      throw error;
    }
  }

  async handleMcpRequest(req, res) {
    try {
      await authenticateMcpToken(req, res, async () => {
        // Handle the MCP request
        const { data } = req.body;
        // Process the data as needed
        res.status(200).json({ message: 'MCP request processed successfully' });
      });
    } catch (error) {
      res.status(403).json({ message: error.message });
    }
  }

  // CRUD operations for VoiceAgentCall
  async createVoiceAgentCall(data) {
    return await VoiceAgentCallModel.VoiceAgentCall.create(data);
  }

  async getVoiceAgentCalls() {
    return await VoiceAgentCallModel.VoiceAgentCall.findMany();
  }

  async getVoiceAgentCallById(id) {
    return await VoiceAgentCallModel.VoiceAgentCall.findUnique({ where: { id } });
  }

  async updateVoiceAgentCall(id, data) {
    return await VoiceAgentCallModel.VoiceAgentCall.update({ where: { id }, data });
  }

  async deleteVoiceAgentCall(id) {
    return await VoiceAgentCallModel.VoiceAgentCall.delete({ where: { id } });
  }
}

module.exports = VoiceAgentCall;
