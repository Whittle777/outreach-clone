const AWS = require('aws-sdk');
const { voiceCallLimiter } = require('../services/rateLimiter');

class AwsSqs {
  constructor(config) {
    this.sqs = new AWS.SQS({ region: 'us-east-1' });
    this.queueUrl = config.queueUrl;
  }

  async sendMessage(message) {
    const params = {
      MessageBody: message,
      QueueUrl: this.queueUrl,
    };
    await this.sqs.sendMessage(params).promise();
  }

  async receiveMessage() {
    const params = {
      QueueUrl: this.queueUrl,
      WaitTimeSeconds: 20,
    };
    const data = await this.sqs.receiveMessage(params).promise();
    if (data.Messages) {
      const message = data.Messages[0];
      await this.sqs.deleteMessage({
        QueueUrl: this.queueUrl,
        ReceiptHandle: message.ReceiptHandle,
      }).promise();
      return message.Body;
    }
    return null;
  }

  async sendMessageWithRateLimit(message, prospectId, phoneNumber) {
    const key = `voiceCall:${prospectId}:${phoneNumber}`;
    if (await voiceCallLimiter.isRateLimited(key)) {
      console.log(`Rate limit exceeded for prospectId: ${prospectId} with phone number: ${phoneNumber}`);
      return;
    }

    await voiceCallLimiter.incrementRequestCount(key);
    await this.sendMessage(message);
  }
}

module.exports = AwsSqs;
