const AWS = require('aws-sdk');

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const sqs = new AWS.SQS();

async function sendMessageToQueue(queueUrl, messageBody) {
  const params = {
    MessageBody: JSON.stringify(messageBody),
    QueueUrl: queueUrl,
  };

  try {
    await sqs.sendMessage(params).promise();
    console.log('Message sent to SQS queue:', messageBody);
  } catch (error) {
    console.error('Error sending message to SQS queue:', error);
    throw new Error('Failed to send message to SQS queue');
  }
}

module.exports = {
  sendMessageToQueue,
};
