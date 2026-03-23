const winston = require('winston');
const WebSocket = require('ws');
const doubleWriteStrategy = require('../services/doubleWriteStrategy');
const config = require('../services/config').getConfig();
const { wss } = require('../services/websocketServer');
const temporalStateManager = require('../services/temporalStateManager');
const slackIntegration = require('../services/slackIntegration');
const microsoftTeamsIntegration = require('../services/microsoftTeamsIntegration');
const kafkaProducer = require('../messageBroker/kafkaProducer');

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
    kafkaProducer.sendToTopic('log', { message, data });
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
    kafkaProducer.sendToTopic('error', { message, data });
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
    kafkaProducer.sendToTopic('info', { message, data });
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
    kafkaProducer.sendToTopic('sentimentAnalysisResult', { message, data });
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
    kafkaProducer.sendToTopic('realTimeTranscript', { message, data });
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
    kafkaProducer.sendToTopic('detectionResult', { message, data });
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
    kafkaProducer.sendToTopic('userPromptParsed', { message, data });
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
    kafkaProducer.sendToTopic('intentHandled', { message, data });
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
    kafkaProducer.sendToTopic('predictiveSearchResult', { message, data });
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
    kafkaProducer.sendToTopic('visualFlag', { message, data });
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
    kafkaProducer.sendToTopic('confidenceScoreRouting', { message, data });
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
    kafkaProducer.sendToTopic('realTimeReasoningLog', { message, data });
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
    slackIntegration.sendInteractiveNotification(data.channel, message, data.actions);
    kafkaProducer.sendToTopic('interactiveNotification', { message, data });
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
    kafkaProducer.sendToTopic('versionChange', { message, data });
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
    kafkaProducer.sendToTopic('migrationStart', { message, data });
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
    kafkaProducer.sendToTopic('migrationProgress', { message, data });
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
    kafkaProducer.sendToTopic('migrationComplete', { message, data });
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
    kafkaProducer.sendToTopic('migrationError', { message, data });
  },
  conversionRatesCalculated: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'conversionRatesCalculated', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'conversionRatesCalculated', data: { message, data } });
    temporalStateManager.saveState('conversionRatesCalculated', { message, data });
    slackIntegration.sendNotification(`Conversion Rates Calculated: ${message}`);
    microsoftTeamsIntegration.sendNotification(`Conversion Rates Calculated: ${message}`);
    kafkaProducer.sendToTopic('conversionRatesCalculated', { message, data });
  },
  oauth2Login: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'oauth2Login', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'oauth2Login', data: { message, data } });
    temporalStateManager.saveState('oauth2Login', { message, data });
    slackIntegration.sendNotification(`OAuth2 Login: ${message}`);
    microsoftTeamsIntegration.sendNotification(`OAuth2 Login: ${message}`);
    kafkaProducer.sendToTopic('oauth2Login', { message, data });
  },
  teamsPhoneExtensibility: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'teamsPhoneExtensibility', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'teamsPhoneExtensibility', data: { message, data } });
    temporalStateManager.saveState('teamsPhoneExtensibility', { message, data });
    slackIntegration.sendNotification(`Teams Phone Extensibility: ${message}`);
    microsoftTeamsIntegration.sendNotification(`Teams Phone Extensibility: ${message}`);
    kafkaProducer.sendToTopic('teams-phone-extensibility', { message, data });
  },
  stirShakenCompliance: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'stirShakenCompliance', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'stirShakenCompliance', data: { message, data } });
    temporalStateManager.saveState('stirShakenCompliance', { message, data });
    slackIntegration.sendNotification(`STIR/SHAKEN Compliance: ${message}`);
    microsoftTeamsIntegration.sendNotification(`STIR/SHAKEN Compliance: ${message}`);
    kafkaProducer.sendToTopic('stir-shaken-compliance', { message, data });
  },
  rateLimitExceeded: (message, data) => {
    logger.warn(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'rateLimitExceeded', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'rateLimitExceeded', data: { message, data } });
    temporalStateManager.saveState('rateLimitExceeded', { message, data });
    slackIntegration.sendNotification(`Rate Limit Exceeded: ${message}`);
    microsoftTeamsIntegration.sendNotification(`Rate Limit Exceeded: ${message}`);
    kafkaProducer.sendToTopic('rateLimitExceeded', { message, data });
  },
  trackingPixelEvent: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'trackingPixelEvent', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'trackingPixelEvent', data: { message, data } });
    temporalStateManager.saveState('trackingPixelEvent', { message, data });
    slackIntegration.sendNotification(`Tracking Pixel Event: ${message}`);
    microsoftTeamsIntegration.sendNotification(`Tracking Pixel Event: ${message}`);
    kafkaProducer.sendToTopic('trackingPixelEvent', { message, data });
  },
  openRate: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'openRate', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'openRate', data: { message, data } });
    temporalStateManager.saveState('openRate', { message, data });
    slackIntegration.sendNotification(`Open Rate: ${message}`);
    microsoftTeamsIntegration.sendNotification(`Open Rate: ${message}`);
    kafkaProducer.sendToTopic('openRate', { message, data });
  },
  ngoeTaskAdded: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'ngoeTaskAdded', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'ngoeTaskAdded', data: { message, data } });
    temporalStateManager.saveState('ngoeTaskAdded', { message, data });
    slackIntegration.sendNotification(`NGOE Task Added: ${message}`);
    microsoftTeamsIntegration.sendNotification(`NGOE Task Added: ${message}`);
    kafkaProducer.sendToTopic('ngoeTaskAdded', { message, data });
  },
  ngoeTaskQueueUpdated: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'ngoeTaskQueueUpdated', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'ngoeTaskQueueUpdated', data: { message, data } });
    temporalStateManager.saveState('ngoeTaskQueueUpdated', { message, data });
    slackIntegration.sendNotification(`NGOE Task Queue Updated: ${message}`);
    microsoftTeamsIntegration.sendNotification(`NGOE Task Queue Updated: ${message}`);
    kafkaProducer.sendToTopic('ngoeTaskQueueUpdated', { message, data });
  },
  voiceAgentWorkflowInitiated: (message, data) => {
    logger.info(message, data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'voiceAgentWorkflowInitiated', data: { message, data } }));
      }
    });
    doubleWriteStrategy.write({ type: 'voiceAgentWorkflowInitiated', data: { message, data } });
    temporalStateManager.saveState('voiceAgentWorkflowInitiated', { message, data });
    slackIntegration.sendNotification(`Voice Agent Workflow Initiated: ${message}`);
    microsoftTeamsIntegration.sendNotification(`Voice Agent Workflow Initiated: ${message}`);
    kafkaProducer.sendToTopic('voiceAgentWorkflowInitiated', { message, data });
  }
};
