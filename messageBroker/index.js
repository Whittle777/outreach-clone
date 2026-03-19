const AwsSqs = require('./awsSqs');
const AzureAcs = require('./azureAcs');
const RabbitMq = require('./rabbitMq');

class MessageBroker {
  constructor(config) {
    this.config = config;
    this.broker = null;
    this.initializeBroker();
  }

  initializeBroker() {
    switch (this.config.type) {
      case 'awsSqs':
        this.broker = new AwsSqs(this.config);
        break;
      case 'azureAcs':
        this.broker = new AzureAcs(this.config);
        break;
      case 'rabbitMq':
        this.broker = new RabbitMq(this.config);
        break;
      default:
        throw new Error('Unsupported message broker type');
    }
  }

  async sendMessage(message, token) {
    return this.broker.sendMessage(message, token);
  }

  async receiveMessage(token) {
    return this.broker.receiveMessage(token);
  }

  async sendMessageWithRateLimit(message, prospectId, phoneNumber, token) {
    return this.broker.sendMessageWithRateLimit(message, prospectId, phoneNumber, token);
  }

  async fetchActiveConstraints(token) {
    return this.broker.fetchActiveConstraints(token);
  }

  async createKnowledgeGraphNodes(prospectData) {
    return this.broker.createKnowledgeGraphNodes(prospectData);
  }

  async close() {
    return this.broker.close();
  }

  async executeNGOETask(task) {
    return this.broker.executeNGOETask(task);
  }

  async handleMCPMessage(message) {
    return this.broker.handleMCPMessage(message);
  }

  async isGDPRCompliant(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript) {
    return this.broker.isGDPRCompliant(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript);
  }

  async createVoiceAgentCall(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, token) {
    return this.broker.createVoiceAgentCall(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, token);
  }
}

module.exports = MessageBroker;
