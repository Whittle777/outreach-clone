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
  rollback: (message) => {
    logger.error('Rollback initiated', { message });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'rollback', data: { message } }));
      }
    });
    doubleWriteStrategy.write({ type: 'rollback', data: { message } });
  },
  audioFileStored: (fileData) => {
    logger.info('Audio file stored', { fileData });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'audioFileStored', data: { fileData } }));
      }
    });
    doubleWriteStrategy.write({ type: 'audioFileStored', data: { fileData } });
  },
  rabbitmqMessageSent: (data) => {
    logger.info('RabbitMQ message sent', { data });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'rabbitmqMessageSent', data: { data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'rabbitmqMessageSent', data: { data } });
  },
  sentimentAnalysis: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'sentimentAnalysis', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'sentimentAnalysis', data: { message, data } });
  },
  azureAcsVoicemailDropInitiated: (prospectData, audioFileUrl) => {
    logger.info('Azure ACS voicemail drop initiated', { prospectData, audioFileUrl });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'azureAcsVoicemailDropInitiated', data: { prospectData, audioFileUrl } }));
      }
    });
    doubleWriteStrategy.write({ type: 'azureAcsVoicemailDropInitiated', data: { prospectData, audioFileUrl } });
  },
  timeBlockCheck: (isWithinBlocks) => {
    if (isWithinBlocks) {
      logger.log('Time is within approved blocks');
    } else {
      logger.error('Time is outside approved blocks');
    }
  },
  stirShakenValidation: (phoneNumber, isCompliant) => {
    if (isCompliant) {
      logger.info('STIR/SHAKEN validation passed', { phoneNumber });
    } else {
      logger.error('STIR/SHAKEN validation failed', { phoneNumber });
    }
  },
  rateLimitHit: (carrier, phoneNumber, count, limit) => {
    logger.warn('Rate limit hit', { carrier, phoneNumber, count, limit });
  },
  callRateCreated: (callRateData) => {
    logger.info('Call rate created', { callRateData });
  },
  callRateRetrieved: (callRateData) => {
    logger.info('Call rate retrieved', { callRateData });
  },
  callRateUpdated: (callRateData) => {
    logger.info('Call rate updated', { callRateData });
  },
  callRateDeleted: (callRateData) => {
    logger.info('Call rate deleted', { callRateData });
  },
  allCallRatesRetrieved: (callRates) => {
    logger.info('All call rates retrieved', { callRates });
  },
  emailSent: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'emailSent', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'emailSent', data: { message, data } });
  },
  emailRetry: (message, data) => {
    logger.warn(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'emailRetry', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'emailRetry', data: { message, data } });
  },
  emailFailed: (message, data) => {
    logger.error(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'emailFailed', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'emailFailed', data: { message, data } });
  },
  realTimeTranscript: (transcriptData) => {
    logger.info('Real-time transcript', { transcriptData });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'realTimeTranscript', data: { transcriptData } }));
      }
    });
    doubleWriteStrategy.write({ type: 'realTimeTranscript', data: { transcriptData } });
  },
  callResistanceDetected: (callData) => {
    logger.warn('Call resistance detected', { callData });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'callResistanceDetected', data: { callData } }));
      }
    });
    doubleWriteStrategy.write({ type: 'callResistanceDetected', data: { callData } });
  },
};
