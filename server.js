const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const awsSqsConsumer = require('./awsSqsConsumer');
const messageBroker = require('./messageBroker');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    console.log('Received message:', message);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Start consuming messages from SQS
awsSqsConsumer.consumeMessages();

// Start receiving messages from the message broker
messageBroker.receiveMessage();

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
