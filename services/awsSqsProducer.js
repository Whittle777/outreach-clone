const AWS = require('aws-sdk');
const config = require('../config');

AWS.config.update({ region: 'us-east-1' });
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

async function sendMessage(message) {
  const params = {
    MessageBody: JSON.stringify(message),
    QueueUrl: config.awsSqs.queueUrl,
  };

  await sqs.sendMessage(params).promise();
}

module.exports = {
  sendMessage,
};
