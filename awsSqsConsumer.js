const AWS = require('aws-sdk');
const axios = require('axios');
const { processMessage } = require('./messageProcessor');
const { storeSentimentAnalysis } = require('./services/sentimentAnalysis');
const { initiateCall } = require('./services/azureCommunicationService');

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

const queueUrl = process.env.AWS_SQS_QUEUE_URL;
const rateLimiterUrl = process.env.RATE_LIMITER_URL || 'http://localhost:8080/rate-limit';

async function consumeMessages() {
  const params = {
    QueueUrl: queueUrl,
    WaitTimeSeconds: 20,
  };

  try {
    const data = await sqs.receiveMessage(params).promise();
    if (data.Messages) {
      data.Messages.forEach(async (message) => {
        const messageBody = JSON.parse(message.Body);
        await processMessage(messageBody);

        // Check rate limit
        const response = await axios.get(`${rateLimiterUrl}/${messageBody.prospectId}`);
        if (response.data.allowed) {
          // Simulate sentiment analysis
          const sentimentScore = 0.8; // Example score
          const sentimentLabel = 'Positive'; // Example label
          const metadata = { source: 'example-source' }; // Example metadata

          await storeSentimentAnalysis(messageBody.prospectId, sentimentScore, sentimentLabel, metadata);

          // Initiate call using Azure Communication Services
          await initiateCall(messageBody.prospectId, messageBody.bento);
        } else {
          console.log(`Rate limit exceeded for prospectId: ${messageBody.prospectId}`);
        }

        const deleteParams = {
          QueueUrl: queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        };
        await sqs.deleteMessage(deleteParams).promise();
      });
    }
  } catch (error) {
    console.error('Error consuming message from SQS:', error);
  }
}

module.exports = {
  consumeMessages,
};
