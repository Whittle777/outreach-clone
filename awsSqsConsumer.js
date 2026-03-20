const { ServiceBusClient } = require('@azure/service-bus');
const messageBroker = require('./messageBroker');
const logger = require('./services/logger');
const VoiceAgentIntegration = require('./services/voiceAgentIntegration');
const azureAcsService = require('./services/azureAcsService');
const wss = require('./websocketServer');
const doubleWriteStrategy = require('./services/doubleWriteStrategy');
const { voiceCallLimiter, emailLimiter, audioFileLimiter } = require('./services/rateLimiter');
const MLModelService = require('./services/mlModelService');

const voiceAgentIntegration = new VoiceAgentIntegration('YOUR_API_KEY', 'https://api.azureacs.com');
const mlModelService = new MLModelService('https://your-ml-model-url.com/predict');

async function consumeMessages(config) {
  const serviceBusClient = new ServiceBusClient(config.connectionString);
  const receiver = serviceBusClient.createReceiver(config.queueName);

  receiver.subscribe({
    async processMessage(message) {
      console.log(' [x] Received %s', message.body);

      // Process the message
      try {
        const messageBody = JSON.parse(message.body);
        let key = '';

        if (messageBody.type === 'voicemailDrop') {
          key = `voicemailDrop:${messageBody.prospectId}`;
          if (await voiceCallLimiter.isRateLimited(key)) {
            logger.warn('Rate limit exceeded for voicemailDrop', { prospectId: messageBody.prospectId });
            return;
          }
          await voiceCallLimiter.incrementRequestCount(key);
          await messageBroker.handleVoicemailDrop(messageBody.prospectId, messageBody.phoneNumber, messageBody.message, messageBody.token);
        } else if (messageBody.type === 'createCall') {
          key = `createCall:${messageBody.prospectId}`;
          if (await voiceCallLimiter.isRateLimited(key)) {
            logger.warn('Rate limit exceeded for createCall', { prospectId: messageBody.prospectId });
            return;
          }
          await voiceCallLimiter.incrementRequestCount(key);
          await voiceAgentIntegration.createCall(messageBody.prospectId, messageBody.phoneNumber, messageBody.script, messageBody.country);
        } else if (messageBody.type === 'updateCallFlags') {
          key = `updateCallFlags:${messageBody.callId}`;
          if (await voiceCallLimiter.isRateLimited(key)) {
            logger.warn('Rate limit exceeded for updateCallFlags', { callId: messageBody.callId });
            return;
          }
          await voiceCallLimiter.incrementRequestCount(key);
          await azureAcsService.updateCallFlags(messageBody.callId, messageBody.flags);
        } else if (messageBody.type === 'callStatusUpdate') {
          key = `callStatusUpdate:${messageBody.callId}`;
          if (await voiceCallLimiter.isRateLimited(key)) {
            logger.warn('Rate limit exceeded for callStatusUpdate', { callId: messageBody.callId });
            return;
          }
          await voiceCallLimiter.incrementRequestCount(key);
          await voiceAgentIntegration.fetchCallStatus(messageBody.callId);
          // Broadcast the call status update to WebSocket clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'callStatusUpdate', data: messageBody }));
            }
          });
        } else if (messageBody.type === 'simulateHITLWorkflow') {
          const prospect = messageBody.prospect;
          const result = await voiceAgentIntegration.simulateHITLWorkflow(prospect);
          console.log('HITL Workflow Result:', result);
        } else if (messageBody.type === 'generatePrediction') {
          key = `generatePrediction:${messageBody.prospectId}`;
          if (await voiceCallLimiter.isRateLimited(key)) {
            logger.warn('Rate limit exceeded for generatePrediction', { prospectId: messageBody.prospectId });
            return;
          }
          await voiceCallLimiter.incrementRequestCount(key);
          const prediction = await mlModelService.generatePrediction(messageBody.data);
          console.log('Prediction:', prediction);
          // Broadcast the prediction to WebSocket clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'prediction', data: prediction }));
            }
          });
        } else if (messageBody.type === 'textToSpeech') {
          key = `textToSpeech:${messageBody.text}`;
          if (await audioFileLimiter.isRateLimited(key)) {
            logger.warn('Rate limit exceeded for textToSpeech', { text: messageBody.text });
            return;
          }
          await audioFileLimiter.incrementRequestCount(key);
          const audioUrl = await azureAcsService.textToSpeech(messageBody.text, messageBody.voiceName);
          console.log('Text to Speech Audio URL:', audioUrl);
          // Broadcast the audio URL to WebSocket clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'textToSpeech', data: { audioUrl } }));
            }
          });
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
