const amqplib = require('amqplib');

class RabbitMq {
  constructor(config) {
    this.config = config;
    this.connection = null;
    this.channel = null;
    this.init();
  }

  async init() {
    this.connection = await amqplib.connect(this.config.connectionString);
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.config.queueName, { durable: true });
  }

  async sendMessage(message, token) {
    await this.channel.sendToQueue(this.config.queueName, Buffer.from(JSON.stringify(message)));
  }

  async receiveMessage(token) {
    return new Promise((resolve, reject) => {
      this.channel.consume(this.config.queueName, (msg) => {
        if (msg !== null) {
          resolve(JSON.parse(msg.content.toString()));
          this.channel.ack(msg);
        } else {
          reject(new Error('No message received'));
        }
      });
    });
  }

  async close() {
    await this.channel.close();
    await this.connection.close();
  }
}

module.exports = RabbitMq;
