const AWS = require('aws-sdk');
const config = require('../config');

class AwsSqs {
  constructor(queueUrl, accessKeyId, secretAccessKey, region) {
    AWS.config.update({
      accessKeyId,
      secretAccessKey,
      region,
    });
    this.sqs = new AWS.SQS();
    this.queueUrl = queueUrl;
  }

  async sendMessage(messageBody) {
    const params = {
      MessageBody: JSON.stringify(messageBody),
      QueueUrl: this.queueUrl,
    };

    try {
      const data = await this.sqs.sendMessage(params).promise();
      console.log('Message sent to SQS', data.MessageId);
      return data.MessageId;
    } catch (error) {
      console.error('Error sending message to SQS', error);
      throw error;
    }
  }
}

module.exports = new AwsSqs(
  config.getConfig().awsSqsUrl,
  config.getConfig().awsAccessKeyId,
  config.getConfig().awsSecretAccessKey,
  config.getConfig().geographicRouting.enabled ? config.getConfig().geographicRouting.region : config.getConfig().awsRegion
);
