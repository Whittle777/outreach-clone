const RabbitMQService = require('../rabbitmq/rabbitmqService');
const config = require('../services/config').getConfig();
const logger = require('../services/logger');
const callRateLimiter = require('../services/callRateLimiter');

class VoiceAgent {
  constructor() {
    this.rabbitmqService = config.messageQueueType === 'rabbitmq' ? new RabbitMQService(config.rabbitmq) : null;
  }

  async sendMessage(message, token) {
    if (this.rabbitmqService) {
      await this.rabbitmqService.sendMessage(message);
    } else {
      logger.error('RabbitMQ is not initialized');
    }
  }

  async receiveMessage(token) {
    if (this.rabbitmqService) {
      return await this.rabbitmqService.receiveMessage(token);
    } else {
      logger.error('RabbitMQ is not initialized');
      return null;
    }
  }

  async sendMessageWithRateLimit(message, prospectId, phoneNumber, token) {
    if (this.rabbitmqService) {
      const isAllowed = await callRateLimiter.checkRateLimit(phoneNumber);
      if (!isAllowed) {
        logger.error('Rate limit exceeded for phone number:', phoneNumber);
        return;
      }
      await this.rabbitmqService.sendMessageWithRateLimit(message, prospectId, phoneNumber, token);
    } else {
      logger.error('RabbitMQ is not initialized');
    }
  }

  async fetchActiveConstraints(token) {
    if (this.rabbitmqService) {
      return await this.rabbitmqService.fetchActiveConstraints(token);
    } else {
      logger.error('RabbitMQ is not initialized');
      return null;
    }
  }

  async createKnowledgeGraphNodes(prospectData) {
    if (this.rabbitmqService) {
      await this.rabbitmqService.createKnowledgeGraphNodes(prospectData);
    } else {
      logger.error('RabbitMQ is not initialized');
    }
  }

  async close() {
    if (this.rabbitmqService) {
      await this.rabbitmqService.close();
    }
  }

  async executeNGOETask(task) {
    if (this.rabbitmqService) {
      return await this.rabbitmqService.executeNGOETask(task);
    } else {
      logger.error('RabbitMQ is not initialized');
      return null;
    }
  }

  async handleMCPMessage(message) {
    if (this.rabbitmqService) {
      await this.rabbitmqService.handleMCPMessage(message);
    } else {
      logger.error('RabbitMQ is not initialized');
    }
  }

  async isGDPRCompliant(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript) {
    if (this.rabbitmqService) {
      return await this.rabbitmqService.isGDPRCompliant(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript);
    } else {
      logger.error('RabbitMQ is not initialized');
      return false;
    }
  }

  async createVoiceAgentCall(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, token) {
    if (this.rabbitmqService) {
      await this.rabbitmqService.createVoiceAgentCall(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, token);
    } else {
      logger.error('RabbitMQ is not initialized');
    }
  }
}

module.exports = VoiceAgent;
