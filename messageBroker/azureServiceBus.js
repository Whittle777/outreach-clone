const { ServiceBusClient } = require('@azure/service-bus');
const { voiceCallLimiter } = require('../services/rateLimiter');
const config = require('../config/settings');
const wss = require('../server').wss;
const jwt = require('jsonwebtoken');
const realTimeReasoningLogs = require('../services/realTimeReasoningLogs');
const KnowledgeGraph = require('../services/knowledgeGraph');
const NGOE = require('../services/ngoeTaskExecutor');
const crypto = require('crypto');

class AzureServiceBus {
  constructor(config) {
    this.serviceBusClient = new ServiceBusClient(config.connectionString);
    this.sender = this.serviceBusClient.createSender(config.topicName);
    this.receiver = this.serviceBusClient.createReceiver(config.subscriptionName);
    this.knowledgeGraph = new KnowledgeGraph(config.neo4j.uri, config.neo4j.user, config.neo4j.password);
    this.ngoe = new NGOE();
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.isFleetCommandCenterUser) {
      throw new Error('Unauthorized access');
    }

    await this.sender.sendMessages({ body: message });
    realTimeReasoningLogs.addLog('sendMessage', `Message sent to Azure Service Bus: ${JSON.stringify(message)}`);
  }

  async receiveMessage(token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.isFleetCommandCenterUser) {
      throw new Error('Unauthorized access');
    }

    const receivedMessages = await this.receiver.receiveMessages(1);
    if (receivedMessages.length > 0) {
      const message = receivedMessages[0];
      await message.complete();
      realTimeReasoningLogs.addLog('receiveMessage', `Message received from Azure Service Bus: ${JSON.stringify(message.body)}`);
      return message.body;
    }
    return null;
  }

  async close() {
    await this.sender.close();
    await this.receiver.close();
    await this.serviceBusClient.close();
  }

  // Method to send message with Microsoft Entra Object ID
  async sendMessageWithEntraObjectId(message, entraObjectId, token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.isFleetCommandCenterUser) {
      throw new Error('Unauthorized access');
    }

    const messageWithEntraObjectId = {
      ...message,
      entraObjectId
    };
    await this.sender.sendMessages({ body: messageWithEntraObjectId });
    realTimeReasoningLogs.addLog('sendMessageWithEntraObjectId', `Message sent with Entra Object ID: ${JSON.stringify(messageWithEntraObjectId)}`);
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
      realTimeReasoningLogs.addLog('sendMessageWithRateLimit', `Rate limit exceeded for prospectId: ${prospectId} with phone number: ${phoneNumber}`);
      return;
    }

    await rateLimiter.incrementRequestCount(key);
    await this.sendMessage(message, token);
  }

  async fetchActiveConstraints(token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.isFleetCommandCenterUser) {
      throw new Error('Unauthorized access');
    }

    // Placeholder for fetching active constraints
    // This should be replaced with actual logic to fetch constraints from Azure Service Bus
    realTimeReasoningLogs.addLog('fetchActiveConstraints', 'Fetching active constraints');
    return {
      constraints: [
        { id: 1, name: 'Constraint 1' },
        { id: 2, name: 'Constraint 2' }
      ]
    };
  }

  async createKnowledgeGraphNodes(prospectData) {
    await this.knowledgeGraph.createNode('Prospect', prospectData);
    realTimeReasoningLogs.addLog('createKnowledgeGraphNodes', `Created knowledge graph nodes for prospect: ${prospectData.firstName}`);
  }

  async close() {
    await this.knowledgeGraph.close();
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
}

module.exports = AzureServiceBus;
