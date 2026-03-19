const azureServiceBus = require('./messageBroker/azureServiceBus');
const awsSqs = require('./messageBroker/awsSqs');
const rabbitMQ = require('./messageBroker/rabbitMQ');
const rateLimiter = require('../services/rateLimiter');
const logger = require('../services/logger');

class MessageBroker {
  constructor(config) {
    this.config = config;
    this.broker = null;
    this.initBroker();
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
    const limit = 10; // Example limit, should be configurable
    const isLimited = await this.isRateLimited(key, limit);

    if (isLimited) {
      logger.log(`Rate limit exceeded for message: ${message.id} with phone number: ${message.phoneNumber}`);
      throw new Error('Rate limit exceeded');
    }

    await this.incrementRequestCount(key);
    return this.broker.sendMessage(message);
  }

  async receiveMessage() {
    return this.broker.receiveMessage();
  }

  async isRateLimited(key, limit) {
    return rateLimiter.isRateLimited(key, limit);
  }

  async incrementRequestCount(key) {
    return rateLimiter.incrementRequestCount(key);
  }
}

module.exports = MessageBroker;
