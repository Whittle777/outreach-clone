const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'email-dispatcher',
  brokers: [process.env.KAFKA_BROKER],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'email-dispatcher-group' });

module.exports = {
  kafka,
  producer,
  consumer,
};
