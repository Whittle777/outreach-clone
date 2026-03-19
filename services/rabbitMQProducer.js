const amqplib = require('amqplib');
const config = require('../config');

let channel = null;
let connection = null;

async function connect() {
  connection = await amqplib.connect(config.rabbitMQ.url);
  channel = await connection.createChannel();
  await channel.assertQueue(config.rabbitMQ.queueName, { durable: true });
}

async function sendMessage(queue, message) {
  if (!channel) {
    await connect();
  }
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
}

async function close() {
  if (channel) {
    await channel.close();
  }
  if (connection) {
    await connection.close();
  }
}

module.exports = {
  sendMessage,
  close,
};
