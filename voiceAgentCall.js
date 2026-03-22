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
const temporalStateManager = require('../services/temporalStateManager');
const VoicemailScriptGenerator = require('./voicemailScriptGenerator');
const TimeBlockConfigModel = require('../models/timeBlockConfig');

class VoiceAgentCall {
  constructor(apiKey) {
    this.azureAcsCallAutomation = new AzureAcsCallAutomation(config.azureAcsConnectionString, config.azureAcsQueueName);
    this.ttsService = new TtsService(config.azureSpeechApiKey, config.azureSpeechRegion);
    this.ngoe = new NGOE();
    this.sentimentAnalysisService = new SentimentAnalysisService(apiKey);
    this.voicemailScriptGenerator = new VoicemailScriptGenerator();
  }

  async initiateCall(callData) {
    const { phoneNumber, prospectData, voiceName } = callData;

    // Apply call rate limiting middleware
    const req = { body: { phoneNumber } };
    const res = { status: (code) => ({ json: (message) => { throw new Error(`${code}: ${message.error}`); } }) };
    const next = () => {};

    try {
      callRateLimiting(req, res, next);
    } catch (error) {
      logger.error('Call rate limit exceeded', { error, phoneNumber });
      throw error;
    }

    // Check time block configuration
    const timeBlockConfig = await TimeBlockConfigModel.TimeBlockConfig.findUnique({ where: { userId: prospectData.userId } });
    if (!this.isTimeWithinApprovedBlocks(timeBlockConfig)) {
      logger.warn('Call initiation outside approved time blocks', { phoneNumber });
      throw new Error('Call initiation outside approved time blocks');
    }

    // Generate voicemail script
    const script = this.voicemailScriptGenerator.generateScript(prospectData);
    logger.info('Voicemail script generated', { script, phoneNumber });

    // Generate TTS audio file
    const outputFilePath = path.join(__dirname, `../temp/${phoneNumber}_tts.wav`);
    try {
      await this.ttsService.generateAndStoreTtsAudio(script, voiceName, outputFilePath);
      logger.info('TTS audio file generated', { phoneNumber, outputFilePath });
    } catch (error) {
      logger.error('Error generating TTS audio file', { error, phoneNumber });
      throw error;
    }

    // Proceed with initiating the call
    try {
      await this.azureAcsCallAutomation.initiateCall(phoneNumber, script, outputFilePath);
      logger.info('Call initiated', { phoneNumber });
    } catch (error) {
      logger.error('Error initiating call', { error, phoneNumber });
      throw error;
    }
  }

  async initiateVoicemailDrop(prospectData, audioFileUrl) {
    try {
      await this.azureAcsCallAutomation.initiateVoicemailDrop(prospectData, audioFileUrl);
      logger.info('Voicemail drop initiated', { prospectData, audioFileUrl });
    } catch (error) {
      logger.error('Error initiating voicemail drop', { error, prospectData, audioFileUrl });
      throw error;
    }
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
    }
  }

  async handleMcpRequest(req, res) {
    try {
      await authenticateMcpToken(req, res, async () => {
        // Handle the MCP request
        const { data } = req.body;
        // Process the data as needed
        res.status(200).json({ message: 'MCP request processed successfully' });
        logger.info('MCP request processed', { data });
      });
    } catch (error) {
      res.status(403).json({ message: error.message });
      logger.error('Error processing MCP request', { error });
    }
  }

  // CRUD operations for VoiceAgentCall
  async createVoiceAgentCall(data) {
    try {
      const createdCall = await VoiceAgentCallModel.VoiceAgentCall.create(data);
      logger.info('VoiceAgentCall created', { createdCall });
      return createdCall;
    } catch (error) {
      logger.error('Error creating VoiceAgentCall', { error, data });
      throw error;
    }
  }

  async getVoiceAgentCalls() {
    try {
      const calls = await VoiceAgentCallModel.VoiceAgentCall.findMany();
      logger.info('VoiceAgentCalls retrieved', { calls });
      return calls;
    } catch (error) {
      logger.error('Error retrieving VoiceAgentCalls', { error });
      throw error;
    }
  }

  async getVoiceAgentCallById(id) {
    try {
      const call = await VoiceAgentCallModel.VoiceAgentCall.findUnique({ where: { id } });
      if (call) {
        logger.info('VoiceAgentCall retrieved by ID', { call });
      } else {
        logger.warn('VoiceAgentCall not found by ID', { id });
      }
      return call;
    } catch (error) {
      logger.error('Error retrieving VoiceAgentCall by ID', { error, id });
      throw error;
    }
  }

  async updateVoiceAgentCall(id, data) {
    try {
      const updatedCall = await VoiceAgentCallModel.VoiceAgentCall.update({ where: { id }, data });
      logger.info('VoiceAgentCall updated', { updatedCall });
      return updatedCall;
    } catch (error) {
      logger.error('Error updating VoiceAgentCall', { error, id, data });
      throw error;
    }
  }

  async deleteVoiceAgentCall(id) {
    try {
      const deletedCall = await VoiceAgentCallModel.VoiceAgentCall.delete({ where: { id } });
      logger.info('VoiceAgentCall deleted', { deletedCall });
      return deletedCall;
    } catch (error) {
      logger.error('Error deleting VoiceAgentCall', { error, id });
      throw error;
    }
  }

  // Method to test end-to-end voice agent call flow with voicemail drop
  async testEndToEndCallFlow(prospectData, voiceName) {
    try {
      // Step 1: Generate voicemail script
      const script = this.voicemailScriptGenerator.generateScript(prospectData);
      logger.info('Voicemail script generated', { script, prospectData });

      // Step 2: Generate TTS audio file
      const outputFilePath = path.join(__dirname, `../temp/${prospectData.phoneNumber}_tts.wav`);
      await this.ttsService.generateAndStoreTtsAudio(script, voiceName, outputFilePath);
      logger.info('TTS audio file generated', { prospectData, outputFilePath });

      // Step 3: Initiate call
      await this.azureAcsCallAutomation.initiateCall(prospectData.phoneNumber, script, outputFilePath);
      logger.info('Call initiated', { prospectData });

      // Step 4: Initiate voicemail drop
      await this.azureAcsCallAutomation.initiateVoicemailDrop(prospectData, outputFilePath);
      logger.info('Voicemail drop initiated', { prospectData });

      logger.info('End-to-end voice agent call flow with voicemail drop completed successfully', { prospectData });
    } catch (error) {
      logger.error('Error in end-to-end voice agent call flow with voicemail drop', { error, prospectData });
      throw error;
    }
  }

  // Helper method to check if the current time is within approved time blocks
  isTimeWithinApprovedBlocks(timeBlockConfig) {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    if (!timeBlockConfig || !timeBlockConfig.daysOfWeek.includes(currentDay)) {
      return false;
    }

    const startMinutes = timeBlockConfig.startTime.split(':').map(Number).reduce((a, b) => a * 60 + b, 0);
    const endMinutes = timeBlockConfig.endTime.split(':').map(Number).reduce((a, b) => a * 60 + b, 0);

    return currentTime >= startMinutes && currentTime <= endMinutes;
  }
}

module.exports = VoiceAgentCall;
