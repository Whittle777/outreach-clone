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
  log: (message) => {
    logger.info(message);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'log', data: message }));
      }
    });
    doubleWriteStrategy.write({ type: 'log', data: message });
  },
  error: (message) => {
    logger.error(message);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'error', data: message }));
      }
    });
    doubleWriteStrategy.write({ type: 'error', data: message });
  },
};
