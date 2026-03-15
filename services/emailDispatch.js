const kafka = require('../config/kafka');
const { handleProspectStatusChange } = require('../services/eventHandlers');
const Broadway = require('broadway');

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
      Broadway.stage('handleStatusChange', async (parsedMessage) => {
        const { prospectId, bento, newStatus } = parsedMessage;
        await handleProspectStatusChange(prospectId, bento, newStatus);
        console.log(`Email dispatch request processed for prospectId: ${prospectId}`);
      }),
      Broadway.stage('produceDispatchedMessage', async (parsedMessage) => {
        await producer.send({
          topic: 'email-dispatched',
          messages: [
            {
              value: JSON.stringify(parsedMessage),
            },
          ],
        });
      }),
    ],
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        await pipeline.run(message);
      } catch (error) {
        console.error('Error processing email dispatch request:', error);
      }
    },
  });
}

module.exports = { run };
