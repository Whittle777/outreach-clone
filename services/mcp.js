const crypto = require('crypto');
const doubleWriteStrategy = require('../services/doubleWriteStrategy');
const logger = require('../services/logger');
const AIGenerator = require('../services/aiGenerator');
const Encryption = require('../services/encryption');
const AzureServiceBus = require('../services/azureServiceBus');
const RateLimiter = require('../services/rateLimiter');
const config = require('../services/config').getConfig();

class MCP {
  constructor() {
    this.protocolVersion = '1.0';
    this.secretKey = process.env.MCP_SECRET_KEY || 'your-secret-key';
    this.aiGenerator = new AIGenerator();
    this.encryption = new Encryption(this.secretKey);
    this.azureServiceBus = services.config.initializeAzureServiceBus();
  }

  encrypt(data) {
    return this.encryption.encrypt(data);
  }

  decrypt(encryptedData) {
    return this.encryption.decrypt(encryptedData);
  }

  async write(data) {
    try {
      await doubleWriteStrategy.write(data);
      logger.log('Data written to MCP successfully', data);
    } catch (error) {
      logger.error('Error writing data to MCP', error);
      throw error;
    }
  }

  async routeByConfidenceScore(confidenceScore, data) {
    const { high, moderate } = config.confidenceScoreRouting;
    if (confidenceScore > high) {
      // High confidence: AI executes autonomously
      await this.write({ type: 'high-confidence', data });
      logger.log('High confidence, AI executes autonomously', data);
    } else if (confidenceScore >= moderate) {
      // Moderate confidence: action paused and routed to review queue
      await this.write({ type: 'moderate-confidence', data });
      logger.log('Moderate confidence, routed to review queue', data);
    } else {
      // Low confidence: workflow halts with high-priority supervisor notifications
      await this.write({ type: 'low-confidence', data });
      logger.log('Low confidence, workflow halted with supervisor notifications', data);
    }
  }

  async sendToCentralAI(data) {
    const encryptedData = this.encrypt(JSON.stringify(data));
    const signature = this.sign(encryptedData);

    // Simulate sending the data to the central AI agent
    console.log('Sending data to central AI agent:', encryptedData, signature);
    // In a real implementation, you would send this to the central AI agent via a network call

    // For now, let's just log the data
    logger.log('Data sent to central AI agent', { encryptedData, signature });
  }

  sign(data) {
    return crypto.createHmac('sha256', this.secretKey)
      .update(data)
      .digest('hex');
  }

  async processSentimentAnalysis(prospectId, sentimentData) {
    try {
      const data = {
        prospectId,
        sentimentData,
      };
      await this.write({ type: 'sentiment-analysis', data });
      logger.sentiment('Sentiment analysis processed', data);
    } catch (error) {
      logger.error('Error processing sentiment analysis', error);
      throw error;
    }
  }

  async initiateAzureAcsVoicemailDrop(prospectData, audioFileUrl, onBehalfOf) {
    try {
      await doubleWriteStrategy.initiateAzureAcsVoicemailDrop(prospectData, audioFileUrl, onBehalfOf);
      logger.azureAcsVoicemailDropInitiated(prospectData, audioFileUrl, onBehalfOf);
    } catch (error) {
      logger.error('Error initiating Azure ACS voicemail drop', error);
    }
  }

  async checkTimeWithinApprovedBlocks() {
    const isWithinBlocks = await doubleWriteStrategy.isTimeWithinApprovedBlocks();
    logger.timeBlockCheck(isWithinBlocks);
    return isWithinBlocks;
  }

  async sendMessageToAzureServiceBus(message) {
    try {
      await this.azureServiceBus.sendMessage(message);
      logger.log('Message sent to Azure Service Bus', message);
    } catch (error) {
      logger.error('Error sending message to Azure Service Bus', error);
    }
  }

  async checkAndIncrementCarrierRateLimit(carrier, phoneNumber) {
    const isRateLimited = await RateLimiter.isCarrierRateLimited(carrier, phoneNumber);
    if (isRateLimited) {
      logger.warn('Carrier rate limit hit', { carrier, phoneNumber });
      throw new Error('Carrier rate limit hit');
    }
    await RateLimiter.incrementCarrierRateLimit(carrier, phoneNumber);
  }

  async createCallRate(callRateData) {
    try {
      await doubleWriteStrategy.createCallRate(callRateData);
      logger.callRateCreated(callRateData);
    } catch (error) {
      logger.error('Error creating call rate', error);
      throw error;
    }
  }

  async getCallRateById(id) {
    try {
      const callRate = await doubleWriteStrategy.getCallRateById(id);
      logger.callRateRetrieved(callRate);
      return callRate;
    } catch (error) {
      logger.error('Error retrieving call rate', error);
    }
  }

  async updateCallRate(id, callRateData) {
    try {
      await doubleWriteStrategy.updateCallRate(id, callRateData);
      logger.callRateUpdated(callRateData);
    } catch (error) {
      logger.error('Error updating call rate', error);
    }
  }

  async deleteCallRate(id) {
    try {
      await doubleWriteStrategy.deleteCallRate(id);
      logger.callRateDeleted(callRateData);
    } catch (error) {
      logger.error('Error deleting call rate', error);
    }
  }

  async getAllCallRates() {
    try {
      const callRates = await doubleWriteStrategy.getAllCallRates();
      logger.allCallRatesRetrieved(callRates);
      return callRates;
    } catch (error) {
      logger.error('Error retrieving all call rates', error);
    }
  }

  async getPersonalizationWaterfall() {
    return doubleWriteStrategy.getPersonalizationWaterfall();
  }
}

module.exports = MCP;
