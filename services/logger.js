const winston = require('winston');
const WebSocket = require('ws');
const doubleWriteStrategy = require('../services/doubleWriteStrategy');
const config = require('../services/config').getConfig();
const { wss } = require('../services/websocketServer');
const temporalStateManager = require('../services/temporalStateManager');
const slackIntegration = require('../services/slackIntegration');
const microsoftTeamsIntegration = require('../services/microsoftTeamsIntegration');

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
    microsoftTeamsIntegration.sendNotification(`Log: ${message}`);
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
    microsoftTeamsIntegration.sendNotification(`Error: ${message}`);
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
    microsoftTeamsIntegration.sendNotification(`Info: ${message}`);
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
    microsoftTeamsIntegration.sendNotification(`Sentiment Analysis Result: ${message}`);
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
    microsoftTeamsIntegration.sendNotification(`Real-Time Transcript: ${message}`);
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
    microsoftTeamsIntegration.sendNotification(`Detection Result: ${message}`);
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
    microsoftTeamsIntegration.sendNotification(`User Prompt Parsed: ${message}`);
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
    microsoftTeamsIntegration.sendNotification(`Intent Handled: ${message}`);
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
    microsoftTeamsIntegration.sendNotification(`Predictive Search Result: ${message}`);
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
    microsoftTeamsIntegration.sendNotification(`Visual Flag: ${message}`);
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
    microsoftTeamsIntegration.sendNotification(`Confidence Score Routing: ${message}`);
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
    microsoftTeamsIntegration.sendNotification(`Real-Time Reasoning Log: ${message}`);
  },
  interactiveNotification: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'interactiveNotification', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'interactiveNotification', data: { message, data } });
    temporalStateManager.saveState('interactiveNotification', { message, data });
    slackIntegration.sendNotification(`Interactive Notification: ${message}`);
    microsoftTeamsIntegration.sendInteractiveNotification(data.channel, message, data.actions);
  },
  versionChange: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'versionChange', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'versionChange', data: { message, data } });
    temporalStateManager.saveState('versionChange', { message, data });
    slackIntegration.sendNotification(`Version Change: ${message}`);
    microsoftTeamsIntegration.sendNotification(`Version Change: ${message}`);
  },
  migrationStart: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'migrationStart', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'migrationStart', data: { message, data } });
    temporalStateManager.saveState('migrationStart', { message, data });
    slackIntegration.sendNotification(`Migration Start: ${message}`);
    microsoftTeamsIntegration.sendNotification(`Migration Start: ${message}`);
  },
  migrationProgress: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'migrationProgress', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'migrationProgress', data: { message, data } });
    temporalStateManager.saveState('migrationProgress', { message, data });
    slackIntegration.sendNotification(`Migration Progress: ${message}`);
    microsoftTeamsIntegration.sendNotification(`Migration Progress: ${message}`);
  },
  migrationComplete: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'migrationComplete', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'migrationComplete', data: { message, data } });
    temporalStateManager.saveState('migrationComplete', { message, data });
    slackIntegration.sendNotification(`Migration Complete: ${message}`);
    microsoftTeamsIntegration.sendNotification(`Migration Complete: ${message}`);
  },
  migrationError: (message, data) => {
    logger.error(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'migrationError', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'migrationError', data: { message, data } });
    temporalStateManager.saveState('migrationError', { message, data });
    slackIntegration.sendNotification(`Migration Error: ${message}`);
    microsoftTeamsIntegration.sendNotification(`Migration Error: ${message}`);
  },
};
