const AWS = require('aws-sdk');

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
}

module.exports = AwsSqs;
