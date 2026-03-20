const { ServiceBusClient } = require('@azure/service-bus');
const { voiceCallLimiter } = require('../services/rateLimiter');
const config = require('../config/settings');
const wss = require('../server').wss;
const jwt = require('jsonwebtoken');
const realTimeReasoningLogs = require('../services/realTimeReasoningLogs');
const KnowledgeGraph = require('../services/knowledgeGraph');
const NGOE = require('../services/ngoeTaskExecutor');
const VoiceAgentCall = require('../models/VoiceAgentCall');
const doubleWriteStrategy = require('../services/doubleWriteStrategy');
const azureAcsClient = require('../messageBroker/azureAcs');
const msal = require('@azure/msal-node');

class AzureServiceBus {
  constructor(config) {
    this.serviceBusClient = new ServiceBusClient(config.serviceBusConnectionString);
    this.sender = this.serviceBusClient.createSender(config.serviceBusQueueName);
    this.receiver = this.serviceBusClient.createReceiver(config.serviceBusQueueName);
    this.knowledgeGraph = new KnowledgeGraph(config.neo4j.uri, config.neo4j.user, config.neo4j.password);
    this.ngoe = new NGOE();
    this.msalClient = new msal.ConfidentialClientApplication({
      auth: {
        clientId: config.microsoftEntra.clientId,
        clientSecret: config.microsoftEntra.clientSecret,
        authority: `https://login.microsoftonline.com/${config.microsoftEntra.tenantId}`
      }
    });
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
    realTimeReasoningLogs.addLog('createVoiceAgentCall', `Created VoiceAgentCall: ${JSON.stringify(voiceAgentCallData)}`);
  }

  async handleVoicemailDrop(prospectId, phoneNumber, message, token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.isFleetCommandCenterUser) {
      throw new Error('Unauthorized access');
    }

    // Create a call using Azure ACS
    const callData = await azureAcsClient.createCall(phoneNumber);
    logger.log('Outbound call created successfully:', callData);

    // Send a message to the queue to handle the voicemail drop
    const voicemailMessage = {
      prospectId,
      phoneNumber,
      callData,
      message
    };

    await this.sendMessage(voicemailMessage, token);
    realTimeReasoningLogs.addLog('handleVoicemailDrop', `Voicemail drop handled for prospectId: ${prospectId}`);
  }

  async getTeamsCallerId(token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.isFleetCommandCenterUser) {
      throw new Error('Unauthorized access');
    }

    const authResponse = await this.msalClient.acquireTokenByClientCredential({
      scopes: ['https://graph.microsoft.com/.default']
    });

    if (!authResponse.accessToken) {
      throw new Error('Failed to acquire access token');
    }

    const teamsCallerId = decoded.microsoftEntraObjectId;
    return teamsCallerId;
  }
}

module.exports = AzureServiceBus;
