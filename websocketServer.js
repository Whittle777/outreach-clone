const WebSocket = require('ws');
const logger = require('./services/logger');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  logger.log('Client connected');

  ws.on('message', (message) => {
    logger.log('Received message:', message);
  });

  ws.on('close', () => {
    logger.log('Client disconnected');
  });
});

module.exports = wss;
