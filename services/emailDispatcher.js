const { producer } = require('../config/kafka');
const { sendMessageToQueue } = require('./awsSqsProducer');

async function dispatchEmail(emailRequest) {
  // Dispatch to Kafka
  await producer.connect();
  await producer.send({
    topic: 'email-dispatch-requests',
    messages: [{
      value: JSON.stringify(emailRequest),
    }],
  });
  await producer.disconnect();

  // Dispatch to AWS SQS
  const queueUrl = process.env.AWS_SQS_QUEUE_URL;
  await sendMessageToQueue(queueUrl, emailRequest);
}

module.exports = {
  dispatchEmail,
};
