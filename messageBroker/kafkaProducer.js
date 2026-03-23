const kafka = require('kafka-node');
const config = require('../config').getConfig();

const client = new kafka.KafkaClient({ kafkaHost: config.kafkaHost });
const producer = new kafka.Producer(client);

producer.on('ready', () => {
  console.log('Kafka producer is ready');
});

producer.on('error', (err) => {
  console.error('Kafka producer error:', err);
});

module.exports = {
  sendToTopic: (topic, message) => {
    const payloads = [
      { topic, messages: JSON.stringify(message) }
    ];
    producer.send(payloads, (err, data) => {
      if (err) {
        console.error('Error sending message to Kafka:', err);
      } else {
        console.log('Message sent to Kafka:', data);
      }
    });
  }
};
