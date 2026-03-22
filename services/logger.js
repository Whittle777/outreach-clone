const winston = require('winston');
const WebSocket = require('ws');
const doubleWriteStrategy = require('../services/doubleWriteStrategy');
const config = require('../services/config').getConfig();
const { wss } = require('../services/websocketServer');
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
  realTimeTranscript: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'realTimeTranscript', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'realTimeTranscript', data: { message, data } });
    temporalStateManager.saveState('realTimeTranscript', { message, data });
    slackIntegration.sendNotification(`Real-Time Transcript: ${message}`);
  },
  detectionResult: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'detectionResult', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'detectionResult', data: { message, data } });
    temporalStateManager.saveState('detectionResult', { message, data });
    slackIntegration.sendNotification(`Detection Result: ${message}`);
  },
  userPromptParsed: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'userPromptParsed', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'userPromptParsed', data: { message, data } });
    temporalStateManager.saveState('userPromptParsed', { message, data });
    slackIntegration.sendNotification(`User Prompt Parsed: ${message}`);
  },
  intentHandled: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'intentHandled', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'intentHandled', data: { message, data } });
    temporalStateManager.saveState('intentHandled', { message, data });
    slackIntegration.sendNotification(`Intent Handled: ${message}`);
  },
  predictiveSearchResult: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'predictiveSearchResult', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'predictiveSearchResult', data: { message, data } });
    temporalStateManager.saveState('predictiveSearchResult', { message, data });
    slackIntegration.sendNotification(`Predictive Search Result: ${message}`);
  },
  visualFlag: (message, data) => {
    logger.warn(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'visualFlag', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'visualFlag', data: { message, data } });
    temporalStateManager.saveState('visualFlag', { message, data });
    slackIntegration.sendNotification(`Visual Flag: ${message}`);
  },
  confidenceScoreRouting: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'confidenceScoreRouting', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'confidenceScoreRouting', data: { message, data } });
    temporalStateManager.saveState('confidenceScoreRouting', { message, data });
    slackIntegration.sendNotification(`Confidence Score Routing: ${message}`);
  },
  realTimeReasoningLog: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'realTimeReasoningLog', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'realTimeReasoningLog', data: { message, data } });
    temporalStateManager.saveState('realTimeReasoningLog', { message, data });
    slackIntegration.sendNotification(`Real-Time Reasoning Log: ${message}`);
  },
};
