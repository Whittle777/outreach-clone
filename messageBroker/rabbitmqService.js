const amqplib = require('amqplib');
const axios = require('axios');
const config = require('../services/config');
const logger = require('../services/logger');
const jwt = require('jsonwebtoken');
const RateLimiter = require('../services/rateLimiter');
const doubleWriteStrategy = require('../services/doubleWriteStrategy');

class RabbitMQService {
  constructor(config) {
    this.connectionString = config.connectionString;
    this.queueName = config.queueName;
    this.connection = null;
    this.channel = null;
    this.stirShakenEnabled = config.stirShakenEnabled;
    this.stirShakenApiUrl = config.stirShakenApiUrl;
    this.stirShakenApiKey = config.stirShakenApiKey;
  }

  async connect() {
    this.connection = await amqplib.connect(this.connectionString);
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.queueName, { durable: true });
  }

  async sendMessage(message, token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.isFleetCommandCenterUser) {
      throw new Error('Unauthorized access');
    }

    await this.channel.sendToQueue(this.queueName, Buffer.from(JSON.stringify(message)));
    logger.log('sendMessage', `Message sent to RabbitMQ: ${JSON.stringify(message)}`);
  }

  async receiveMessage(token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.isFleetCommandCenterUser) {
      throw new Error('Unauthorized access');
    }

    const message = await this.channel.get(this.queueName, { noAck: true });
    if (message) {
      logger.log('receiveMessage', `Message received from RabbitMQ: ${JSON.stringify(message.content.toString())}`);
      return JSON.parse(message.content.toString());
    }
    return null;
  }

  async sendMessageWithRateLimit(message, prospectId, phoneNumber, token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.isFleetCommandCenterUser) {
      throw new Error('Unauthorized access');
    }

    const key = `voiceCall:${prospectId}:${phoneNumber}`;
    const limit = config.rateLimits.teamsPhoneNumbers[phoneNumber]?.limit || 10;
    const duration = config.rateLimits.teamsPhoneNumbers[phoneNumber]?.duration || 60;
    const rateLimiter = new RateLimiter(limit, duration);

    if (await rateLimiter.isRateLimited(key)) {
      console.log(`Rate limit exceeded for prospectId: ${prospectId} with phone number: ${phoneNumber}`);
      logger.log('sendMessageWithRateLimit', `Rate limit exceeded for prospectId: ${prospectId} with phone number: ${phoneNumber}`);
      return;
    }

    await rateLimiter.incrementRequestCount(key);

    // STIR/SHAKEN validation
    const isCompliant = await this.checkSTIRSHAKENCompliance(phoneNumber);
    if (!isCompliant) {
      logger.error('STIR/SHAKEN validation failed', { phoneNumber });
      throw new Error('STIR/SHAKEN validation failed');
    }

    await this.sendMessage(message, token);
  }

  async fetchActiveConstraints(token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.isFleetCommandCenterUser) {
      throw new Error('Unauthorized access');
    }

    // Placeholder for fetching active constraints
    // This should be replaced with actual logic to fetch constraints from RabbitMQ
    logger.log('fetchActiveConstraints', 'Fetching active constraints');
    return {
      constraints: [
        { id: 1, name: 'Constraint 1' },
        { id: 2, name: 'Constraint 2' }
      ]
    };
  }

  async createKnowledgeGraphNodes(prospectData) {
    await this.knowledgeGraph.createNode('Prospect', prospectData);
    logger.log('createKnowledgeGraphNodes', `Created knowledge graph nodes for prospect: ${prospectData.firstName}`);
  }

  async close() {
    await this.connection.close();
  }

  async executeNGOETask(task) {
    return this.ngoe.executeTask(task);
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

  async createVoiceAgentCall(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.isFleetCommandCenterUser) {
      throw new Error('Unauthorized access');
    }

    const isCompliant = await this.isGDPRCompliant(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript);
    if (!isCompliant) {
      throw new Error('Data not compliant with GDPR');
    }

    const voiceAgentCallData = {
      prospectId,
      callStatus,
      preGeneratedScript,
      ttsAudioFileUrl,
      callTranscript
    };

    await doubleWriteStrategy.write(voiceAgentCallData);
    logger.log('createVoiceAgentCall', `Created VoiceAgentCall: ${JSON.stringify(voiceAgentCallData)}`);
  }

  async checkSTIRSHAKENCompliance(phoneNumber) {
    if (!this.stirShakenEnabled) {
      logger.log('STIR/SHAKEN compliance check is disabled');
      return true;
    }

    try {
      const response = await axios.post(this.stirShakenApiUrl, {
        phoneNumber,
        apiKey: this.stirShakenApiKey
      });

      if (response.data.isCompliant) {
        logger.log('STIR/SHAKEN compliance check passed', { phoneNumber });
        return true;
      } else {
        logger.error('STIR/SHAKEN compliance check failed', { phoneNumber });
        return false;
      }
    } catch (error) {
      logger.error('Error checking STIR/SHAKEN compliance', { phoneNumber, error });
      return false;
    }
  }
}

module.exports = RabbitMQService;
