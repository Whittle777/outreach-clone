const WebSocket = require('ws');
const logger = require('./services/logger');

// noServer mode — attached to the Express HTTP server in index.js so both
// share one port (required for Railway / any single-port cloud deployment)
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
  logger.log('Client connected');
  ws.on('message', (message) => logger.log('Received message:', message));
  ws.on('close', () => logger.log('Client disconnected'));
});

module.exports = wss;
