const kafka = require('kafka-node');
const config = require('../config').getConfig();
const Broadway = require('broadway');

const client = new kafka.KafkaClient({ kafkaHost: config.kafkaHost });
const producer = new kafka.Producer(client);

producer.on('ready', () => {
  console.log('Kafka producer is ready');
});

producer.on('error', (err) => {
  console.error('Kafka producer error:', err);
});

const consumer = new kafka.Consumer(client, [{ topic: 'log', partition: 0 }], {
  autoCommit: false
});

const broadway = new Broadway({
  consumer,
  processor: (message, done) => {
    console.log('Processing message:', message.value);
    // Add your processing logic here
    done();
  },
  batchSize: 10,
  batchTimeout: 1000
});

broadway.on('error', (err) => {
  console.error('Broadway error:', err);
});

broadway.on('processed', (message) => {
  console.log('Message processed:', message.value);
});

const MAX_QUEUE_LENGTH = 100; // Define a maximum queue length

module.exports = {
  sendToTopic: (topic, message) => {
    return new Promise((resolve, reject) => {
      if (producer.queueLength() > MAX_QUEUE_LENGTH) {
        console.warn('Kafka producer queue is full, waiting...');
        setTimeout(() => {
          module.exports.sendToTopic(topic, message).then(resolve).catch(reject);
        }, 1000); // Wait for 1 second before retrying
      } else {
        const payloads = [
          { topic, messages: JSON.stringify(message) }
        ];
        producer.send(payloads, (err, data) => {
          if (err) {
            console.error('Error sending message to Kafka:', err);
            reject(err);
          } else {
            console.log('Message sent to Kafka:', data);
            resolve(data);
          }
        });
      }
    });
  },
  sendTeamsPhoneExtensibilityMessage: (message) => {
    return module.exports.sendToTopic('teams-phone-extensibility', message);
  },
  sendStirShakenComplianceMessage: (message) => {
    return module.exports.sendToTopic('stir-shaken-compliance', message);
  }
};
