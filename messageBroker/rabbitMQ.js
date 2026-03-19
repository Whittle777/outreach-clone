const amqplib = require('amqplib');
const { voiceCallLimiter } = require('../services/rateLimiter');
const config = require('../config/settings');
const wss = require('../server').wss;
const jwt = require('jsonwebtoken');
const realTimeReasoningLogs = require('../services/realTimeReasoningLogs');
const KnowledgeGraph = require('../services/knowledgeGraph');
const MicrosoftTeamsApp = require('../services/microsoftTeamsApp');
const doubleWriteStrategy = require('../services/doubleWriteStrategy');
const NGOE = require('../services/ngoeTaskExecutor');
const crypto = require('crypto');

class RabbitMQ {
  constructor(config) {
    this.url = config.url;
    this.queueName = config.queueName;
    this.connection = null;
    this.channel = null;
    this.knowledgeGraph = new KnowledgeGraph(config.neo4j.uri, config.neo4j.user, config.neo4j.password);
    this.microsoftTeamsApp = new MicrosoftTeamsApp();
    this.ngoe = new NGOE();
    this.init();
  }

  async init() {
    this.connection = await amqplib.connect(this.url);
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.queueName, { durable: true });
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

    await this.channel.sendToQueue(this.queueName, Buffer.from(JSON.stringify(message)));
    realTimeReasoningLogs.addLog('sendMessage', `Message sent to RabbitMQ: ${JSON.stringify(message)}`);
  }

  async receiveMessage(token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.isFleetCommandCenterUser) {
      throw new Error('Unauthorized access');
    }

    const message = await this.channel.get(this.queueName, { noAck: true });
    if (message) {
      realTimeReasoningLogs.addLog('receiveMessage', `Message received from RabbitMQ: ${message.content.toString()}`);
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
    // This should be replaced with actual logic to fetch constraints from RabbitMQ
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

  async sendMessageToMicrosoftTeams(message) {
    await this.microsoftTeamsApp.sendMessage(message);
  }

  async sendApprovalNotificationToMicrosoftTeams(prospectData, action) {
    const message = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": "0078D7",
      "summary": "Approval Required",
      "sections": [{
        "activityTitle": "Approval Required",
        "activitySubtitle": `Action: ${action} on prospect ${prospectData.firstName} ${prospectData.lastName}`,
        "facts": [
          {
            "name": "Prospect Name",
            "value": `${prospectData.firstName} ${prospectData.lastName}`
          },
          {
            "name": "Company",
            "value": prospectData.companyName
          }
        ],
        "potentialAction": [{
          "@type": "ActionCard",
          "name": "Approve",
          "inputs": [{
            "@type": "TextInput",
            "id": "approvalReason",
            "title": "Reason for Approval",
            "isMultiline": true
          }],
          "actions": [{
            "@type": "HttpPOST",
            "name": "Approve",
            "target": `${config.serverUrl}/api/approve`,
            "body": `{"prospectId": "${prospectData.id}", "action": "${action}", "reason": "{{approvalReason}}"}`,
            "headers": [
              {
                "name": "Authorization",
                "value": `Bearer ${this.botToken}`
              }
            ]
          }]
        },
        {
          "@type": "ActionCard",
          "name": "Reject",
          "inputs": [{
            "@type": "TextInput",
            "id": "rejectionReason",
            "title": "Reason for Rejection",
            "isMultiline": true
          }],
          "actions": [{
            "@type": "HttpPOST",
            "name": "Reject",
            "target": `${config.serverUrl}/api/reject`,
            "body": `{"prospectId": "${prospectData.id}", "action": "${action}", "reason": "{{rejectionReason}}"}`,
            "headers": [
              {
                "name": "Authorization",
                "value": `Bearer ${this.botToken}`
              }
            ]
          }]
        }]
      }]
    };

    await this.microsoftTeamsApp.sendMessage(JSON.stringify(message));
    realTimeReasoningLogs.addLog('sendApprovalNotificationToMicrosoftTeams', `Sent approval notification to Microsoft Teams: ${JSON.stringify(message)}`);
  }

  async executeNGOETask(task) {
    return this.ngoe.executeTask(task);
  }
}

module.exports = RabbitMQ;
