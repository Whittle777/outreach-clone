const winston = require('winston');
const WebSocket = require('ws');
const doubleWriteStrategy = require('../services/doubleWriteStrategy');
const config = require('../services/config').getConfig();
const { wss } = require('../services/websocket');
const temporalStateManager = require('../services/temporalStateManager');
const slackIntegration = require('../services/slackIntegration');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

wss.on('connection', (ws) => {
  logger.log('WebSocket client connected');
  ws.on('close', () => {
    logger.log('WebSocket client disconnected');
  });
});

module.exports = {
  log: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'log', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'log', data: { message, data } });
    temporalStateManager.saveState('log', { message, data });
    slackIntegration.sendNotification(`Log: ${message}`);
  },
  error: (message, data) => {
    logger.error(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'error', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'error', data: { message, data } });
    temporalStateManager.saveState('error', { message, data });
    slackIntegration.sendNotification(`Error: ${message}`);
  },
  info: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'info', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'info', data: { message, data } });
    temporalStateManager.saveState('info', { message, data });
    slackIntegration.sendNotification(`Info: ${message}`);
  },
  sentimentAnalysisResult: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'sentimentAnalysisResult', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'sentimentAnalysisResult', data: { message, data } });
    temporalStateManager.saveState('sentimentAnalysisResult', { message, data });
    slackIntegration.sendNotification(`Sentiment Analysis Result: ${message}`);
  },
  // Other methods remain unchanged...
};
