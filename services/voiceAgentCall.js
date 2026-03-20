const config = require('../services/config').getConfig();
const callRateLimiting = require('../middleware/callRateLimiting');
const AzureAcsCallAutomation = require('./azureAcsCallAutomation');
const logger = require('../services/logger');

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
}

module.exports = VoiceAgentCall;
