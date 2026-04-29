const WebSocket = require('ws');
const logger = require('./services/logger');

const WS_PORT = parseInt(process.env.WEBSOCKET_PORT || '8080');

const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`WebSocket: port ${WS_PORT} in use, server will be unavailable this session`);
  } else {
    console.error('WebSocket error:', err.message);
  }
});

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
