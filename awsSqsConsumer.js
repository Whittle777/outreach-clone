const AWS = require('aws-sdk');
const sqs = new AWS.SQS({ region: 'us-east-1' });

async function consumeMessages(config) {
  const params = {
    QueueUrl: config.queueUrl,
    WaitTimeSeconds: 20,
  };

  try {
    const data = await sqs.receiveMessage(params).promise();
    if (data.Messages) {
      data.Messages.forEach(async (message) => {
        // Process the message
        const messageBody = JSON.parse(message.Body);
        console.log(' [x] Received %s', messageBody);

        // Process the message
        await processMessage(messageBody);

        // Delete the message from the queue
        const deleteParams = {
          QueueUrl: config.queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        };
        await sqs.deleteMessage(deleteParams).promise();
      });
    }
  } catch (error) {
    console.error('Error consuming messages:', error);
  }
}

module.exports = {
  consumeMessages,
};
