const AwsSqs = require('../messageBroker/awsSqs');
const config = require('../config/settings');
const logger = require('../services/logger');

class VoiceAgent {
  constructor() {
    this.awsSqs = config.getConfig().messageQueueType === 'sqs' ? new AwsSqs(config.getConfig()) : null;
  }

  async sendMessage(message, token) {
    if (this.awsSqs) {
      await this.awsSqs.sendMessage(message, token);
    } else {
      logger.error('AWS SQS is not initialized');
    }
  }

  async receiveMessage(token) {
    if (this.awsSqs) {
      return await this.awsSqs.receiveMessage(token);
    } else {
      logger.error('AWS SQS is not initialized');
      return null;
    }
  }

  async sendMessageWithRateLimit(message, prospectId, phoneNumber, token) {
    if (this.awsSqs) {
      await this.awsSqs.sendMessageWithRateLimit(message, prospectId, phoneNumber, token);
    } else {
      logger.error('AWS SQS is not initialized');
    }
  }

  async fetchActiveConstraints(token) {
    if (this.awsSqs) {
      return await this.awsSqs.fetchActiveConstraints(token);
    } else {
      logger.error('AWS SQS is not initialized');
      return null;
    }
  }

  async createKnowledgeGraphNodes(prospectData) {
    if (this.awsSqs) {
      await this.awsSqs.createKnowledgeGraphNodes(prospectData);
    } else {
      logger.error('AWS SQS is not initialized');
    }
  }

  async close() {
    if (this.awsSqs) {
      await this.awsSqs.close();
    }
  }

  async executeNGOETask(task) {
    if (this.awsSqs) {
      return await this.awsSqs.executeNGOETask(task);
    } else {
      logger.error('AWS SQS is not initialized');
      return null;
    }
  }

  async handleMCPMessage(message) {
    if (this.awsSqs) {
      await this.awsSqs.handleMCPMessage(message);
    } else {
      logger.error('AWS SQS is not initialized');
    }
  }

  async isGDPRCompliant(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript) {
    if (this.awsSqs) {
      return await this.awsSqs.isGDPRCompliant(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript);
    } else {
      logger.error('AWS SQS is not initialized');
      return false;
    }
  }

  async createVoiceAgentCall(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, token) {
    if (this.awsSqs) {
      await this.awsSqs.createVoiceAgentCall(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, token);
    } else {
      logger.error('AWS SQS is not initialized');
    }
  }
}

module.exports = VoiceAgent;
