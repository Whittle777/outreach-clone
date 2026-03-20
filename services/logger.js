const winston = require('winston');
const wss = require('../server').wss;
const doubleWriteStrategy = require('../services/doubleWriteStrategy');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
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
  },
  error: (message, data) => {
    logger.error(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'error', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'error', data: { message, data } });
  },
  info: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'info', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'info', data: { message, data } });
  },
  sentiment: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'sentiment', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'sentiment', data: { message, data } });
  },
  aiDecision: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'aiDecision', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'aiDecision', data: { message, data } });
  },
  microsoftTeamsNotification: (message) => {
    logger.info('Microsoft Teams Notification', { message });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'microsoftTeamsNotification', data: { message } }));
      }
    });
    doubleWriteStrategy.write({ type: 'microsoftTeamsNotification', data: { message } });
  },
  consistencyCheck: (isConsistent) => {
    if (isConsistent) {
      logger.log('Data consistency check passed');
    } else {
      logger.error('Data consistency check failed');
    }
  },
};
