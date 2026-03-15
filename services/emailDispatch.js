const kafka = require('../config/kafka');
const { handleProspectStatusChange } = require('../services/eventHandlers');

const producer = kafka.producer();

async function run() {
  await producer.connect();

  await consumer.connect();
  await consumer.subscribe({ topic: 'email-dispatch-requests', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const { prospectId, bento, newStatus } = JSON.parse(message.value.toString());
        await handleProspectStatusChange(prospectId, bento, newStatus);
        console.log(`Email dispatch request processed for prospectId: ${prospectId}`);

        // Produce a message to the 'email-dispatched' topic
        await producer.send({
          topic: 'email-dispatched',
          messages: [
            {
              value: JSON.stringify({ prospectId, bento, newStatus }),
            },
          ],
        });
      } catch (error) {
        console.error('Error processing email dispatch request:', error);
      }
    },
  });
}

module.exports = { run };
