const AWS = require('aws-sdk');
const config = require('../config/settings');
const logger = require('../services/logger');
const VoiceAgentCall = require('../models/VoiceAgentCall');
const NGOE = require('../services/ngoeTaskExecutor');

class AwsSqsConsumer {
  constructor(config) {
    this.sqs = new AWS.SQS({ region: config.region });
    this.queueUrl = config.queueUrl;
    this.ngoe = new NGOE();
  }

  async startConsuming() {
    setInterval(async () => {
      const params = {
        QueueUrl: this.queueUrl,
        WaitTimeSeconds: 20,
      };

      try {
        const data = await this.sqs.receiveMessage(params).promise();
        if (data.Messages) {
          const message = data.Messages[0];
          const messageBody = JSON.parse(message.Body);

          // Process the message
          await this.processMessage(messageBody);

          // Delete the message from the queue
          await this.sqs.deleteMessage({
            QueueUrl: this.queueUrl,
            ReceiptHandle: message.ReceiptHandle,
          }).promise();
        }
      } catch (error) {
        logger.error('Error consuming message from SQS:', error);
      }
    }, 1000); // Poll every second
  }

  async processMessage(message) {
    const { prospectId, phoneNumber, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript } = message;

    // Update the VoiceAgentCall state
    await VoiceAgentCall.update(prospectId, { callStatus });

    // Perform sentiment analysis
    const sentimentData = await this.sentimentAnalysisService.analyze(callTranscript);
    const sentimentScore = sentimentData.score;
    const sentimentLabel = sentimentData.label;
    const metadata = { source: 'sentiment-analysis-service' };

    // Store sentiment analysis results in the database
    await storeSentimentAnalysis(prospectId, sentimentScore, sentimentLabel, metadata, country, region);

    // Send real-time update to frontend
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'voiceCallUpdate', data: message }));
      }
    });

    // Detect and flag resistance or regulatory edge cases
    const hasResistanceOrRegulatoryFlag = await VoiceAgentCall.detectResistanceOrRegulatoryEdgeCase(prospectId, callTranscript);
    if (hasResistanceOrRegulatoryFlag) {
      logger.error(`Resistance or regulatory edge case detected for prospectId: ${prospectId}`);
      // Flag the case (e.g., update database or send alert)
      await VoiceAgentCall.flagResistanceOrRegulatoryCase(prospectId);
    }

    // Route message based on confidence score
    if (message.confidenceScore > 85) {
      logger.log(`High confidence score, routing to AI execution for prospectId: ${prospectId}`);
      // Implement AI execution logic here
      await this.aiGenerator.executeAI(prospectId, callTranscript);
    } else if (message.confidenceScore > 70) {
      logger.log(`Moderate confidence score, routing to review queue for prospectId: ${prospectId}`);
      // Implement review queue logic here
    } else {
      logger.log(`Low confidence score, routing to high-priority supervisor notifications for prospectId: ${prospectId}`);
      // Implement high-priority supervisor notifications logic here
    }
  }
}

module.exports = AwsSqsConsumer;
