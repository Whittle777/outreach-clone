const WebSocket = require('ws');
const logger = require('../services/logger');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  logger.log('WebSocket client connected');
  ws.on('close', () => {
    logger.log('WebSocket client disconnected');
  });
});

module.exports = { wss };
