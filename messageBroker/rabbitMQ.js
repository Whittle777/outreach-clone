const amqplib = require('amqplib');

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
}

module.exports = RabbitMQ;
