const { getConfig } = require('../config/index');
const { ServiceBusClient } = require('@azure/service-bus');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { connect, Channel, Connection } = require('amqplib');

class MessageBroker {
  constructor() {
    const config = getConfig();
    this.messageBrokerType = config.messageBrokerType;
    this.config = config;

    if (this.messageBrokerType === 'azureServiceBus') {
      this.client = new ServiceBusClient(config.azureAcsConnectionString);
    } else if (this.messageBrokerType === 'awsSqs') {
      this.client = new SQSClient({ region: config.awsRegion });
    } else if (this.messageBrokerType === 'rabbitMQ') {
      this.connection = null;
      this.channel = null;
    } else {
      throw new Error(`Unsupported message broker type: ${this.messageBrokerType}`);
    }
  }

  async sendMessage(message) {
    if (this.messageBrokerType === 'azureServiceBus') {
      const sender = this.client.createSender(this.config.azureAcsQueueName);
      await sender.sendMessages({ body: message });
    } else if (this.messageBrokerType === 'awsSqs') {
      const command = new SendMessageCommand({
        QueueUrl: this.config.awsSqsUrl,
        MessageBody: JSON.stringify(message),
      });
      await this.client.send(command);
    } else if (this.messageBrokerType === 'rabbitMQ') {
      if (!this.connection) {
        this.connection = await connect(`amqp://${this.config.rabbitMQHost}:${this.config.rabbitMQPort}`);
        this.channel = await this.connection.createChannel();
        await this.channel.assertQueue(this.config.rabbitMQQueueName, { durable: true });
      }
      await this.channel.sendToQueue(this.config.rabbitMQQueueName, Buffer.from(JSON.stringify(message)));
    }
  }

  async close() {
    if (this.messageBrokerType === 'azureServiceBus') {
      await this.client.close();
    } else if (this.messageBrokerType === 'awsSqs') {
      // No need to close the client for AWS SQS
    } else if (this.messageBrokerType === 'rabbitMQ') {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    }
  }
}

module.exports = MessageBroker;
