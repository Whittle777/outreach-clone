const AWS = require('aws-sdk');
const { processMessage } = require('./messageProcessor');

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

const queueUrl = process.env.AWS_SQS_QUEUE_URL;

async function consumeMessages() {
  const params = {
    QueueUrl: queueUrl,
    WaitTimeSeconds: 20,
  };

  try {
    const data = await sqs.receiveMessage(params).promise();
    if (data.Messages) {
      data.Messages.forEach(async (message) => {
        await processMessage(JSON.parse(message.Body));
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
