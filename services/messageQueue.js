// services/messageQueue.js

class MessageQueue {
  constructor(type, config) {
    this.type = type;
    this.config = config;
    this.consumer = null;
  }

  async connect() {
    if (this.type === 'aws-sqs') {
      this.consumer = require('../awsSqsConsumer');
    } else if (this.type === 'rabbitmq') {
      this.consumer = require('../rabbitmqConsumer');
    } else {
      throw new Error('Unsupported message queue type');
    }
  }

  async startConsuming() {
    if (this.consumer) {
      await this.consumer.startConsumer(this.config);
    } else {
      throw new Error('Consumer not initialized');
    }
  }
}

module.exports = MessageQueue;
