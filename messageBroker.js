const azureServiceBus = require('./messageBroker/azureServiceBus');
const awsSqs = require('./messageBroker/awsSqs');
const rabbitMQ = require('./messageBroker/rabbitMQ');
const rateLimiter = require('../services/rateLimiter');
const logger = require('../services/logger');
const config = require('../config/settings');
const VoiceAgentCall = require('../models/VoiceAgentCall');
const SentimentAnalysis = require('../services/sentimentAnalysis');
const wss = require('../server').wss;

class MessageBroker {
  constructor(config) {
    this.config = config;
    this.broker = null;
    this.initBroker();
    this.sentimentAnalysisService = new SentimentAnalysis(process.env.SENTIMENT_ANALYSIS_API_KEY);
  }

  initBroker() {
    switch (this.config.messageBroker) {
      case 'azure-service-bus':
        this.broker = new azureServiceBus(this.config.azureServiceBus);
        break;
      case 'aws-sqs':
        this.broker = new awsSqs(this.config.awsSqs);
        break;
      case 'rabbitmq':
        this.broker = new rabbitMQ(this.config.rabbitMQ);
        break;
      default:
        throw new Error('Unsupported message broker');
    }
  }

  async sendMessage(message) {
    const key = `message:${message.id}:${message.phoneNumber}`;
    const limit = this.getRateLimitForPhoneNumber(message.phoneNumber);
    const isLimited = await this.isRateLimited(key, limit);

    if (isLimited) {
      logger.log(`Rate limit exceeded for message: ${message.id} with phone number: ${message.phoneNumber}`);
      throw new Error('Rate limit exceeded');
    }

    await this.incrementRequestCount(key);
    return this.broker.sendMessage(message);
  }

  async receiveMessage() {
    const message = await this.broker.receiveMessage();
    if (message) {
      await this.handleMessage(message);
    }
    return message;
  }

  async handleMessage(message) {
    // Assuming the message contains a prospectId and phoneNumber
    const { prospectId, phoneNumber } = message;

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

  async fetchActiveConstraints() {
    return this.broker.fetchActiveConstraints();
  }
}

module.exports = MessageBroker;
