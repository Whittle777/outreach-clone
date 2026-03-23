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
    this.channel.on('flow', (ok) => {
      if (!ok) {
        console.warn('RabbitMQ channel is paused, waiting...');
        setTimeout(() => {
          this.channel.resume();
        }, 1000); // Wait for 1 second before resuming
      }
    });
  }

  async sendMessage(message, token) {
    return new Promise((resolve, reject) => {
      if (!this.channel.isFlowOk) {
        console.warn('RabbitMQ channel is paused, waiting...');
        setTimeout(() => {
          this.sendMessage(message, token).then(resolve).catch(reject);
        }, 1000); // Wait for 1 second before retrying
      } else {
        this.channel.sendToQueue(this.config.queueName, Buffer.from(JSON.stringify(message)), {
          persistent: true
        }, (err, ok) => {
          if (err) {
            console.error('Error sending message to RabbitMQ:', err);
            reject(err);
          } else {
            console.log('Message sent to RabbitMQ:', ok);
            resolve(ok);
          }
        });
      }
    });
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
