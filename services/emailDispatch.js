const kafka = require('../config/kafka');
const { handleProspectStatusChange } = require('../services/eventHandlers');
const Broadway = require('broadway');
const { validateEmailBatch } = require('./validation');

const producer = kafka.producer();
const consumer = kafka.consumer();

async function run() {
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: 'email-dispatch-requests', fromBeginning: true });

  const pipeline = Broadway.pipeline({
    stages: [
      Broadway.stage('parseMessage', async (message) => {
        return JSON.parse(message.value.toString());
      }),
      Broadway.stage('batchMessages', async (messages) => {
        const batch = [];
        for (const message of messages) {
          batch.push(message);
        }
        return batch;
      }),
      Broadway.stage('validateEmailBatch', async (batch) => {
        const validationResults = await validateEmailBatch(batch);
        const validMessages = batch.filter((message, index) => validationResults[index]);
        if (validMessages.length !== batch.length) {
          throw new Error('Some messages in the batch are invalid');
        }
        return validMessages;
      }),
      Broadway.stage('handleStatusChange', async (messages) => {
        for (const message of messages) {
          const { prospectId, bento, newStatus } = message;
          await handleProspectStatusChange(prospectId, bento, newStatus);
          console.log(`Email dispatch request processed for prospectId: ${prospectId}`);
        }
      }),
      Broadway.stage('produceDispatchedMessage', async (messages) => {
        await producer.send({
          topic: 'email-dispatched',
          messages: messages.map(message => ({
            value: JSON.stringify(message),
          })),
        });
      }),
    ],
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        await pipeline.run([message]);
      } catch (error) {
        console.error('Error processing email dispatch request:', error);
      }
    },
  });
}

module.exports = { run };
