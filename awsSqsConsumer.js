const { ServiceBusClient } = require('@azure/service-bus');
const messageBroker = require('./messageBroker');
const logger = require('./services/logger');
const VoiceAgentIntegration = require('./services/voiceAgentIntegration');
const azureAcsService = require('./services/azureAcsService');

const voiceAgentIntegration = new VoiceAgentIntegration('YOUR_API_KEY', 'https://api.azureacs.com');

async function consumeMessages(config) {
  const serviceBusClient = new ServiceBusClient(config.connectionString);
  const receiver = serviceBusClient.createReceiver(config.queueName);

  receiver.subscribe({
    async processMessage(message) {
      console.log(' [x] Received %s', message.body);

      // Process the message
      try {
        const messageBody = JSON.parse(message.body);
        if (messageBody.type === 'voicemailDrop') {
          await messageBroker.handleVoicemailDrop(messageBody.prospectId, messageBody.phoneNumber, messageBody.message, messageBody.token);
        } else if (messageBody.type === 'createCall') {
          await voiceAgentIntegration.createCall(messageBody.prospectId, messageBody.phoneNumber, messageBody.script, messageBody.country);
        } else if (messageBody.type === 'updateCallFlags') {
          await azureAcsService.updateCallFlags(messageBody.callId, messageBody.flags);
        } else {
          await processMessage(messageBody);
        }
      } catch (error) {
        logger.error('Error processing message:', error, { messageBody });
      }

      // Complete the message
      await message.complete();
    },
    async processError(err) {
      logger.error('Error processing message:', err);
    }
  });

  // Close the receiver and the client when done
  // await receiver.close();
  // await serviceBusClient.close();
}

module.exports = {
  consumeMessages,
};
