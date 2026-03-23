const { Kafka } = require('kafkajs');
const config = require('../config');
const emailService = require('../services/emailService');

const kafka = new Kafka({
  clientId: 'email-dispatch-consumer',
  brokers: [config.kafkaBroker],
});

const consumer = kafka.consumer({ groupId: 'email-dispatch-group' });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: config.kafkaTopic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const emailData = JSON.parse(message.value.toString());
        console.log(`Received email dispatch request for ${emailData.to}`);
        await emailService.sendEmail(emailData);
        console.log(`Email dispatched to ${emailData.to}`);
      } catch (error) {
        console.error(`Error processing email dispatch request:`, error);
      }
    },
  });
};

run().catch(console.error);
