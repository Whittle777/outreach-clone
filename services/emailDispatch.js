const kafka = require('../config/kafka');
const { handleProspectStatusChange } = require('../services/eventHandlers');

const consumer = kafka.consumer({ groupId: 'email-dispatch-group' });

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'email-dispatch-requests', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const { prospectId, bento, newStatus } = JSON.parse(message.value.toString());
        await handleProspectStatusChange(prospectId, bento, newStatus);
        console.log(`Email dispatch request processed for prospectId: ${prospectId}`);
      } catch (error) {
        console.error('Error processing email dispatch request:', error);
      }
    },
  });
}

module.exports = { run };
