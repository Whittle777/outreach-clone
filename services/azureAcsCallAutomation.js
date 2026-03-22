const { ServiceBusClient } = require('@azure/service-bus');
const logger = require('../services/logger');
const config = require('../services/config');

class AzureAcsCallAutomation {
  constructor() {
    this.serviceBusClient = new ServiceBusClient(config.getConfig().serviceBusConnectionString);
    this.serviceBusSender = this.serviceBusClient.createSender(config.getConfig().serviceBusQueueName);
  }

  async initiateCall(prospectData, script, audioFileUrl) {
    try {
      const callData = {
        prospectId: prospectData.id,
        phoneNumber: prospectData.phoneNumber,
        script: script,
        audioFileUrl: audioFileUrl,
      };

      await this.serviceBusSender.sendMessages({ body: JSON.stringify(callData) });
      logger.log('Call initiation message sent to Service Bus', callData);
    } catch (error) {
      logger.error('Error initiating call', error);
      throw error;
    }
  }

  async initiateVoicemailDrop(prospectData, audioFileUrl) {
    try {
      const voicemailData = {
        prospectId: prospectData.id,
        phoneNumber: prospectData.phoneNumber,
        audioFileUrl: audioFileUrl,
      };

      await this.serviceBusSender.sendMessages({ body: JSON.stringify(voicemailData) });
      logger.log('Voicemail drop message sent to Service Bus', voicemailData);
    } catch (error) {
      logger.error('Error initiating voicemail drop', error);
      throw error;
    }
  }

  async close() {
    await this.serviceBusClient.close();
    logger.log('Service Bus client closed');
  }
}

module.exports = new AzureAcsCallAutomation();
