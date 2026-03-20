const config = require('../services/config').getConfig();
const callRateLimiting = require('../middleware/callRateLimiting');
const AzureAcsCallAutomation = require('./azureAcsCallAutomation');
const logger = require('../services/logger');
const doubleWriteStrategy = require('./doubleWriteStrategy');

class VoiceAgentCall {
  constructor() {
    this.azureAcsCallAutomation = new AzureAcsCallAutomation(config.azureAcsConnectionString, config.azureAcsQueueName);
  }

  async initiateCall(callData) {
    const { phoneNumber, script } = callData;

    // Apply call rate limiting middleware
    const req = { body: { phoneNumber } };
    const res = { status: (code) => ({ json: (message) => { throw new Error(`${code}: ${message.error}`); } }) };
    const next = () => {};

    try {
      callRateLimiting(req, res, next);
    } catch (error) {
      throw error;
    }

    // Proceed with initiating the call
    await this.azureAcsCallAutomation.createCall(phoneNumber, script);
  }

  async handleRealTimeTranscript(transcriptData) {
    // Log the real-time transcript
    logger.realTimeTranscript(transcriptData);
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
}

module.exports = VoiceAgentCall;
