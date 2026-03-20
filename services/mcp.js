const crypto = require('crypto');
const doubleWriteStrategy = require('../services/doubleWriteStrategy');
const logger = require('../services/logger');
const AIGenerator = require('../services/aiGenerator');
const Encryption = require('../services/encryption'); // Add this line
const AzureServiceBus = require('../services/azureServiceBus'); // Add this line

class MCP {
  constructor() {
    this.protocolVersion = '1.0';
    this.secretKey = process.env.MCP_SECRET_KEY || 'your-secret-key'; // Use environment variable for secret key
    this.aiGenerator = new AIGenerator(); // Add this line
    this.encryption = new Encryption(this.secretKey); // Add this line
    this.azureServiceBus = services.config.initializeAzureServiceBus(); // Add this line
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
    if (confidenceScore > 85) {
      // High confidence: AI executes autonomously
      await this.write({ type: 'high-confidence', data });
      logger.log('High confidence, AI executes autonomously', data);
    } else if (confidenceScore >= 70) {
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
      throw error;
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
      throw error;
    }
  }
}

module.exports = MCP;
