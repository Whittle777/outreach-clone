const azureServiceBus = require('./messageBroker/azureServiceBus');
const awsSqs = require('./messageBroker/awsSqs');
const rabbitMQ = require('./messageBroker/rabbitMQ');

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
    return this.broker.sendMessage(message);
  }

  async receiveMessage() {
    return this.broker.receiveMessage();
  }
}

module.exports = MessageBroker;
