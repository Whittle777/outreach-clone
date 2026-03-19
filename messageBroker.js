const azureServiceBus = require('./messageBroker/azureServiceBus');
const awsSqs = require('./messageBroker/awsSqs');
const rabbitMQ = require('./messageBroker/rabbitMQ');
const azureAcs = require('./messageBroker/azureAcs');
const rateLimiter = require('../services/rateLimiter');
const logger = require('../services/logger');
const config = require('../config/settings');
const VoiceAgentCall = require('../models/VoiceAgentCall');
const SentimentAnalysis = require('../services/sentimentAnalysis');
const wss = require('../server').wss;
const jwt = require('jsonwebtoken');
const AIGenerator = require('../services/aiGenerator');
const NGOE = require('../services/ngoeTaskExecutor');
const MCPGateway = require('./messageBroker/mcpGateway');
const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');
const AwsSqsConsumer = require('./messageBroker/awsSqsConsumer');

class MessageBroker {
  constructor(config) {
    this.config = config;
    this.broker = null;
    this.fallbackBroker = null;
    this.ngoe = new NGOE();
    this.initBroker();
    this.sentimentAnalysisService = new SentimentAnalysis(process.env.SENTIMENT_ANALYSIS_API_KEY);
    this.aiGenerator = new AIGenerator();
    this.mcpGateway = new MCPGateway(config.mcpGateway);
    this.azureAcsClient = new azureAcs(config.azureAcs);
    this.awsSqsConsumer = new AwsSqsConsumer(config.awsSqs);
  }

  initBroker() {
    switch (this.config.messageBroker) {
      case 'azure-service-bus':
        this.broker = new azureServiceBus(this.config.azureServiceBus);
        this.fallbackBroker = new rabbitMQ(this.config.rabbitMQ);
        break;
      case 'aws-sqs':
        this.broker = new awsSqs(this.config.awsSqs);
        this.fallbackBroker = new rabbitMQ(this.config.rabbitMQ);
        break;
      case 'rabbitmq':
        this.broker = new rabbitMQ(this.config.rabbitMQ);
        this.fallbackBroker = new azureServiceBus(this.config.azureServiceBus);
        break;
      default:
        throw new Error('Unsupported message broker');
    }
  }

  encrypt(data) {
    const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY, process.env.ENCRYPTION_IV);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  decrypt(encryptedData) {
    const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY, process.env.ENCRYPTION_IV);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async sendMessage(message, token) {
    const encryptedMessage = this.encrypt(JSON.stringify(message));
    try {
      return await this.broker.sendMessage(encryptedMessage, token);
    } catch (error) {
      logger.error(`Primary broker failed: ${error.message}`);
      return await this.fallbackBroker.sendMessage(encryptedMessage, token);
    }
  }

  async receiveMessage(token) {
    try {
      const encryptedMessage = await this.broker.receiveMessage(token);
      if (encryptedMessage) {
        const message = JSON.parse(this.decrypt(encryptedMessage));
        return message;
      }
      return null;
    } catch (error) {
      logger.error(`Primary broker failed: ${error.message}`);
      const encryptedMessage = await this.fallbackBroker.receiveMessage(token);
      if (encryptedMessage) {
        const message = JSON.parse(this.decrypt(encryptedMessage));
        return message;
      }
      return null;
    }
  }

  async handleMessage(message) {
    // Assuming the message contains a prospectId and phoneNumber
    const { prospectId, phoneNumber, confidenceScore } = message;

    // Update the VoiceAgentCall state to 'Failed'
    await VoiceAgentCall.update(prospectId, { callStatus: 'Failed' });

    logger.log(`Updated VoiceAgentCall state to 'Failed' for prospectId: ${prospectId}`);

    // Capture and store real-time text transcript
    const transcript = await captureTranscript(prospectId);
    await storeTranscript(prospectId, transcript);

    // Perform sentiment analysis
    const sentimentData = await this.sentimentAnalysisService.analyze(transcript);
    const sentimentScore = sentimentData.score;
    const sentimentLabel = sentimentData.label;
    const metadata = { source: 'sentiment-analysis-service' };

    // Store sentiment analysis results in the database
    await storeSentimentAnalysis(prospectId, sentimentScore, sentimentLabel, metadata, country, region);

    // Send real-time update to frontend
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'voiceCallUpdate', data: message }));
      }
    });

    // Detect and flag resistance or regulatory edge cases
    const hasResistanceOrRegulatoryFlag = await VoiceAgentCall.detectResistanceOrRegulatoryEdgeCase(prospectId, transcript);
    if (hasResistanceOrRegulatoryFlag) {
      logger.error(`Resistance or regulatory edge case detected for prospectId: ${prospectId}`);
      // Flag the case (e.g., update database or send alert)
      await VoiceAgentCall.flagResistanceOrRegulatoryCase(prospectId);
    }

    // Route message based on confidence score
    if (confidenceScore > 85) {
      logger.log(`High confidence score, routing to AI execution for prospectId: ${prospectId}`);
      // Implement AI execution logic here
      await this.aiGenerator.executeAI(prospectId, transcript);
    } else if (confidenceScore > 70) {
      logger.log(`Moderate confidence score, routing to review queue for prospectId: ${prospectId}`);
      // Implement review queue logic here
    } else {
      logger.log(`Low confidence score, routing to high-priority supervisor notifications for prospectId: ${prospectId}`);
      // Implement high-priority supervisor notifications logic here
    }
  }

  async isRateLimited(key, limit) {
    return rateLimiter.isRateLimited(key, limit);
  }

  async incrementRequestCount(key) {
    return rateLimiter.incrementRequestCount(key);
  }

  getRateLimitForPhoneNumber(phoneNumber) {
    const rateLimitConfig = this.config.rateLimits.teamsPhoneNumbers[phoneNumber];
    if (rateLimitConfig) {
      return rateLimitConfig.limit;
    }
    return 10; // Default limit if no specific configuration is found
  }

  async fetchActiveConstraints(token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.isFleetCommandCenterUser) {
      throw new Error('Unauthorized access');
    }

    return this.broker.fetchActiveConstraints(token);
  }

  async executeNGOETask(task) {
    return this.ngoe.executeTask(task);
  }

  async sendMCPMessage(message, token) {
    const encryptedMessage = this.encrypt(JSON.stringify(message));
    return this.mcpGateway.sendMessage(encryptedMessage, token);
  }

  async receiveMCPMessage(encryptedMessage, token) {
    const decryptedMessage = this.decrypt(encryptedMessage);
    return this.mcpGateway.receiveMessage(decryptedMessage, token);
  }

  async handleMCPMessage(message) {
    // Implement logic to handle messages received from the MCP Gateway
    logger.log('Handling MCP message:', message);
    // Example: Forward the message to the central AI agents
    await this.aiGenerator.processMessage(message);
  }

  async isGDPRCompliant(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript) {
    // Implement GDPR compliance checks
    // For now, let's assume it always returns true
    return true;
  }

  async makeOutboundCall(phoneNumber) {
    try {
      const callData = await this.azureAcsClient.createCall(phoneNumber);
      logger.log('Outbound call created successfully:', callData);
      return callData;
    } catch (error) {
      logger.error('Failed to create outbound call:', error);
      throw error;
    }
  }

  async handleVoicemailDrop(prospectId, phoneNumber, message, token) {
    return this.broker.handleVoicemailDrop(prospectId, phoneNumber, message, token);
  }

  startAwsSqsConsumer() {
    this.awsSqsConsumer.startConsuming();
  }
}

module.exports = MessageBroker;

// Create an Express app
const app = express();
app.use(bodyParser.json());

// Define a route to classify buyer sentiment
app.post('/api/classify-sentiment', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const sentimentData = await this.sentimentAnalysisService.analyze(text);
    res.json(sentimentData);
  } catch (error) {
    logger.error('Error classifying sentiment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Define CRUD routes for VoiceAgentCall
app.post('/api/voice-agent-calls', async (req, res) => {
  try {
    const { prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript } = req.body;
    const isCompliant = await MessageBroker.isGDPRCompliant(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript);
    if (!isCompliant) {
      return res.status(400).json({ error: 'Data not compliant with GDPR' });
    }
    const voiceAgentCall = await VoiceAgentCall.create(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript);
    res.status(201).json(voiceAgentCall);
  } catch (error) {
    logger.error('Error creating VoiceAgentCall:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/voice-agent-calls/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const voiceAgentCall = await VoiceAgentCall.findById(id);
    if (!voiceAgentCall) {
      return res.status(404).json({ error: 'VoiceAgentCall not found' });
    }
    res.json(voiceAgentCall);
  } catch (error) {
    logger.error('Error retrieving VoiceAgentCall:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/voice-agent-calls/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript } = req.body;
    const isCompliant = await MessageBroker.isGDPRCompliant(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript);
    if (!isCompliant) {
      return res.status(400).json({ error: 'Data not compliant with GDPR' });
    }
    const updatedVoiceAgentCall = await VoiceAgentCall.update(id, { callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript });
    if (!updatedVoiceAgentCall) {
      return res.status(404).json({ error: 'VoiceAgentCall not found' });
    }
    res.json(updatedVoiceAgentCall);
  } catch (error) {
    logger.error('Error updating VoiceAgentCall:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/voice-agent-calls/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedVoiceAgentCall = await VoiceAgentCall.delete(id);
    if (!deletedVoiceAgentCall) {
      return res.status(404).json({ error: 'VoiceAgentCall not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting VoiceAgentCall:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Define a route to make an outbound call
app.post('/api/make-outbound-call', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const callData = await this.makeOutboundCall(phoneNumber);
    res.status(201).json(callData);
  } catch (error) {
    logger.error('Error making outbound call:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Define a route to handle voicemail drop
app.post('/api/handle-voicemail-drop', async (req, res) => {
  try {
    const { prospectId, phoneNumber, message, token } = req.body;
    if (!prospectId || !phoneNumber || !message || !token) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await this.handleVoicemailDrop(prospectId, phoneNumber, message, token);
    res.status(200).json({ message: 'Voicemail drop handled successfully' });
  } catch (error) {
    logger.error('Error handling voicemail drop:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.log(`Sentiment classification API listening on port ${PORT}`);
});
