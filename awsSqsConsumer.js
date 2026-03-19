const AWS = require('aws-sdk');
const axios = require('axios');
const { processMessage } = require('./messageProcessor');
const { storeSentimentAnalysis } = require('./services/sentimentAnalysis');
const { initiateCall } = require('./services/azureCommunicationService');
const GeolocationService = require('./services/geolocationService');
const { voiceCallLimiter } = require('./services/rateLimiter');
const logger = require('../services/logger');
const SentimentAnalysis = require('./services/sentimentAnalysis');
const AIGenerator = require('./services/aiGenerator');
const wss = require('../server').wss;

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

const queueUrl = process.env.AWS_SQS_QUEUE_URL;
const rateLimiterUrl = process.env.RATE_LIMITER_URL || 'http://localhost:8080/rate-limit';
const geolocationService = new GeolocationService(process.env.GEOLOCATION_API_KEY);
const sentimentAnalysisService = new SentimentAnalysis(process.env.SENTIMENT_ANALYSIS_API_KEY);

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

        // Check GDPR compliance
        if (!isGDPRCompliant(messageBody)) {
          logger.error(`Message not compliant with GDPR: ${JSON.stringify(messageBody)}`);
          return;
        }

        // Check rate limit
        const key = `voiceCall:${messageBody.prospectId}`;
        if (await voiceCallLimiter.isRateLimited(key)) {
          logger.log(`Rate limit exceeded for prospectId: ${messageBody.prospectId}`);
          return;
        }

        await voiceCallLimiter.incrementRequestCount(key);

        // Determine the user's country based on IP address
        const country = await geolocationService.getCountryByIp(messageBody.ipAddress);

        // Route data based on country
        const region = getRegionByCountry(country);

        // Generate AI-generated call goal and talk track
        const callGoal = await AIGenerator.generateCallGoal(messageBody);
        const talkTrack = await AIGenerator.generateTalkTrack(messageBody);

        // Capture and store real-time text transcript
        const transcript = await captureTranscript(messageBody.prospectId);
        await storeTranscript(messageBody.prospectId, transcript);

        // Perform sentiment analysis
        const sentimentData = await sentimentAnalysisService.analyze(transcript);
        const sentimentScore = sentimentData.score;
        const sentimentLabel = sentimentData.label;
        const metadata = { source: 'sentiment-analysis-service' };

        // Store sentiment analysis results in the database
        await storeSentimentAnalysis(messageBody.prospectId, sentimentScore, sentimentLabel, metadata, country, region);

        // Initiate call using Azure Communication Services
        await initiateCall(messageBody.prospectId, messageBody.bento, country, region);

        // Send real-time update to frontend
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'voiceCallUpdate', data: messageBody }));
          }
        });
      });
    }
  } catch (error) {
    console.error('Error consuming message from SQS:', error);
  }
}

function getRegionByCountry(country) {
  // Example routing logic
  switch (country) {
    case 'US':
      return 'us-east-1';
    case 'EU':
      return 'eu-west-1';
    default:
      return 'us-west-2';
  }
}

function isGDPRCompliant(messageBody) {
  // Example GDPR compliance check
  // Ensure that the message contains a valid email and does not contain sensitive data
  return messageBody.email && !messageBody.sensitiveData;
}

async function captureTranscript(prospectId) {
  // Simulate capturing a transcript
  // In a real-world scenario, this would involve listening to the call and transcribing it
  return `Transcript for prospectId ${prospectId}`;
}

async function storeTranscript(prospectId, transcript) {
  // Store the transcript in the database
  // This is a placeholder for the actual database interaction
  console.log(`Stored transcript for prospectId ${prospectId}: ${transcript}`);
}

module.exports = {
  consumeMessages,
};
