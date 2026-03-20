const WebSocket = require('ws');
const config = require('../services/config').getConfig();
const logger = require('../services/logger');

const wss = new WebSocket.Server({ port: config.webSocket.port });

wss.on('connection', (ws) => {
  logger.log('WebSocket client connected');
  ws.on('close', () => {
    logger.log('WebSocket client disconnected');
  });
});

module.exports = {
  wss,
};
