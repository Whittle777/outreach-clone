const AWS = require('aws-sdk');
const sqs = new AWS.SQS({ region: 'us-east-1' });
const messageBroker = require('./messageBroker');
const logger = require('./services/logger');
const VoiceAgentIntegration = require('./services/voiceAgentIntegration');

const voiceAgentIntegration = new VoiceAgentIntegration('YOUR_API_KEY', 'https://api.azureacs.com');

async function consumeMessages(config) {
  const params = {
    QueueUrl: config.queueUrl,
    WaitTimeSeconds: 20,
  };

  try {
    const data = await sqs.receiveMessage(params).promise();
    if (data.Messages) {
      data.Messages.forEach(async (message) => {
        // Process the message
        const messageBody = JSON.parse(message.Body);
        console.log(' [x] Received %s', messageBody);

        // Process the message
        try {
          if (messageBody.type === 'voicemailDrop') {
            await messageBroker.handleVoicemailDrop(messageBody.prospectId, messageBody.phoneNumber, messageBody.message, messageBody.token);
          } else if (messageBody.type === 'createCall') {
            await voiceAgentIntegration.createCall(messageBody.prospectId, messageBody.phoneNumber, messageBody.script);
          } else {
            await processMessage(messageBody);
          }
        } catch (error) {
          logger.error('Error processing message:', error, { messageBody });
        }

        // Delete the message from the queue
        const deleteParams = {
          QueueUrl: config.queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        };
        await sqs.deleteMessage(deleteParams).promise();
      });
    }
  } catch (error) {
    logger.error('Error consuming messages:', error);
  }
}

module.exports = {
  consumeMessages,
};
