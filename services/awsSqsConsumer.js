// services/awsSqsConsumer.js

const AWS = require('aws-sdk');

class AwsSqsConsumer {
  constructor() {
    this.sqs = new AWS.SQS({ region: 'us-east-1' });
  }

  async startConsumer(config) {
    const params = {
      QueueUrl: config.queueUrl,
      WaitTimeSeconds: 20
    };

    try {
      const data = await this.sqs.receiveMessage(params).promise();
      if (data.Messages) {
        data.Messages.forEach(async (message) => {
          console.log('Received message:', message.Body);
          // Process the message
          await this.sqs.deleteMessage({
            QueueUrl: config.queueUrl,
            ReceiptHandle: message.ReceiptHandle
          }).promise();
        });
      }
    } catch (error) {
      console.error('Error consuming message from AWS SQS', error);
    }
  }
}

module.exports = new AwsSqsConsumer();
