const amqplib = require('amqplib');
const { voiceCallLimiter } = require('../services/rateLimiter');
const config = require('../config/settings');
const wss = require('../server').wss;

class RabbitMQ {
  constructor(config) {
    this.url = config.url;
    this.queueName = config.queueName;
    this.connection = null;
    this.channel = null;
    this.init();
  }

  async init() {
    this.connection = await amqplib.connect(this.url);
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.queueName, { durable: true });
  }

  async sendMessage(message) {
    await this.channel.sendToQueue(this.queueName, Buffer.from(message));
  }

  async receiveMessage() {
    const message = await this.channel.get(this.queueName, { noAck: true });
    if (message) {
      return message.content.toString();
    }
    return null;
  }

  async close() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }

  async sendMessageWithRateLimit(message, prospectId, phoneNumber) {
    const key = `voiceCall:${prospectId}:${phoneNumber}`;
    const limit = config.rateLimits.teamsPhoneNumbers[phoneNumber]?.limit || 10;
    const duration = config.rateLimits.teamsPhoneNumbers[phoneNumber]?.duration || 60;
    const rateLimiter = new RateLimiter(limit, duration);

    if (await rateLimiter.isRateLimited(key)) {
      console.log(`Rate limit exceeded for prospectId: ${prospectId} with phone number: ${phoneNumber}`);
      return;
    }

    await rateLimiter.incrementRequestCount(key);
    await this.sendMessage(message);
  }

  async fetchActiveConstraints() {
    // Placeholder for fetching active constraints
    // This should be replaced with actual logic to fetch constraints from RabbitMQ
    return {
      constraints: [
        { id: 1, name: 'Constraint 1' },
        { id: 2, name: 'Constraint 2' }
      ]
    };
  }
}

module.exports = RabbitMQ;
