const rabbitmqConsumer = require('../rabbitmqConsumer');

async function processMessage(message) {
  // Implement message processing logic here
  console.log('Processing message:', message);
}

module.exports = {
  processMessage,
};

// Start the RabbitMQ consumer
rabbitmqConsumer.startConsumer();
