const amqplib = require('amqplib');
const config = require('../config');
const mcp = require('../services/mcp');

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

  // Simulate sending message using MCP Gateway
  const encryptedMessage = mcp.encrypt(JSON.stringify(message));
  const signature = mcp.sign(encryptedMessage);

  channel.sendToQueue(queue, Buffer.from(JSON.stringify({ encryptedMessage, signature })));
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
