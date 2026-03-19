const azureServiceBus = require('./messageBroker/azureServiceBus');
const awsSqs = require('./messageBroker/awsSqs');
const rabbitMQ = require('./messageBroker/rabbitMQ');
const rateLimiter = require('../services/rateLimiter');
const logger = require('../services/logger');
const config = require('../config/settings');
const VoiceAgentCall = require('../models/VoiceAgentCall');
const SentimentAnalysis = require('../services/sentimentAnalysis');
const wss = require('../server').wss;
const jwt = require('jsonwebtoken');
const AIGenerator = require('../services/aiGenerator');
const NGOE = require('../services/ngoeTaskExecutor');
const MCPGateway = require('./messageBroker/mcpGateway');
const crypto = require('crypto');

class MessageBroker {
  constructor(config) {
    this.config = config;
    this.broker = null;
    this.fallbackBroker = null;
    this.ngoe = new NGOE();
    this.initBroker();
    this.sentimentAnalysisService = new SentimentAnalysis(process.env.SENTIMENT_ANALYSIS_API_KEY);
    this.aiGenerator = new AIGenerator();
    this.mcpGateway = new MCPGateway(config.mcpGateway);
  }

  initBroker() {
    switch (this.config.messageBroker) {
      case 'azure-service-bus':
        this.broker = new azureServiceBus(this.config.azureServiceBus);
        this.fallbackBroker = new rabbitMQ(this.config.rabbitMQ);
        break;
      case 'aws-sqs':
        this.broker = new awsSqs(this.config.awsSqs);
        this.fallbackBroker = new rabbitMQ(this.config.rabbitMQ);
        break;
      case 'rabbitmq':
        this.broker = new rabbitMQ(this.config.rabbitMQ);
        this.fallbackBroker = new azureServiceBus(this.config.azureServiceBus);
        break;
      default:
        throw new Error('Unsupported message broker');
    }
  }

  encrypt(data) {
    const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY, process.env.ENCRYPTION_IV);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  decrypt(encryptedData) {
    const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY, process.env.ENCRYPTION_IV);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async sendMessage(message, token) {
    const encryptedMessage = this.encrypt(JSON.stringify(message));
    try {
      return await this.broker.sendMessage(encryptedMessage, token);
    } catch (error) {
      logger.error(`Primary broker failed: ${error.message}`);
      return await this.fallbackBroker.sendMessage(encryptedMessage, token);
    }
  }

  async receiveMessage(token) {
    try {
      const encryptedMessage = await this.broker.receiveMessage(token);
      if (encryptedMessage) {
        const message = JSON.parse(this.decrypt(encryptedMessage));
        return message;
      }
      return null;
    } catch (error) {
      logger.error(`Primary broker failed: ${error.message}`);
      const encryptedMessage = await this.fallbackBroker.receiveMessage(token);
      if (encryptedMessage) {
        const message = JSON.parse(this.decrypt(encryptedMessage));
        return message;
      }
      return null;
    }
  }

  async handleMessage(message) {
    // Assuming the message contains a prospectId and phoneNumber
    const { prospectId, phoneNumber, confidenceScore } = message;

    // Update the VoiceAgentCall state to 'Failed'
    await VoiceAgentCall.update(prospectId, { callStatus: 'Failed' });

    logger.log(`Updated VoiceAgentCall state to 'Failed' for prospectId: ${prospectId}`);

    // Capture and store real-time text transcript
    const transcript = await captureTranscript(prospectId);
    await storeTranscript(prospectId, transcript);

    // Perform sentiment analysis
    const sentimentData = await this.sentimentAnalysisService.analyze(transcript);
    const sentimentScore = sentimentData.score;
    const sentimentLabel = sentimentData.label;
    const metadata = { source: 'sentiment-analysis-service' };

    // Store sentiment analysis results in the database
    await storeSentimentAnalysis(prospectId, sentimentScore, sentimentLabel, metadata, country, region);

    // Send real-time update to frontend
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'voiceCallUpdate', data: message }));
      }
    });

    // Detect and flag resistance or regulatory edge cases
    const hasResistanceOrRegulatoryFlag = await VoiceAgentCall.detectResistanceOrRegulatoryEdgeCase(prospectId, transcript);
    if (hasResistanceOrRegulatoryFlag) {
      logger.error(`Resistance or regulatory edge case detected for prospectId: ${prospectId}`);
      // Flag the case (e.g., update database or send alert)
      await VoiceAgentCall.flagResistanceOrRegulatoryCase(prospectId);
    }

    // Route message based on confidence score
    if (confidenceScore > 85) {
      logger.log(`High confidence score, routing to AI execution for prospectId: ${prospectId}`);
      // Implement AI execution logic here
    } else if (confidenceScore > 70) {
      logger.log(`Moderate confidence score, routing to review queue for prospectId: ${prospectId}`);
      // Implement review queue logic here
    } else {
      logger.log(`Low confidence score, routing to high-priority supervisor notifications for prospectId: ${prospectId}`);
      // Implement high-priority supervisor notifications logic here
    }
  }

  async isRateLimited(key, limit) {
    return rateLimiter.isRateLimited(key, limit);
  }

  async incrementRequestCount(key) {
    return rateLimiter.incrementRequestCount(key);
  }

  getRateLimitForPhoneNumber(phoneNumber) {
    const rateLimitConfig = this.config.rateLimits.teamsPhoneNumbers[phoneNumber];
    if (rateLimitConfig) {
      return rateLimitConfig.limit;
    }
    return 10; // Default limit if no specific configuration is found
  }

  async fetchActiveConstraints(token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.isFleetCommandCenterUser) {
      throw new Error('Unauthorized access');
    }

    return this.broker.fetchActiveConstraints(token);
  }

  async executeNGOETask(task) {
    return this.ngoe.executeTask(task);
  }

  async sendMCPMessage(message, token) {
    const encryptedMessage = this.encrypt(JSON.stringify(message));
    return this.mcpGateway.sendMessage(encryptedMessage, token);
  }

  async receiveMCPMessage(encryptedMessage, token) {
    const decryptedMessage = this.decrypt(encryptedMessage);
    return this.mcpGateway.receiveMessage(decryptedMessage, token);
  }
}

module.exports = MessageBroker;
