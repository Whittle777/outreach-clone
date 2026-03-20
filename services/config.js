const defaultConfig = {
  messageQueueType: 'serviceBus', // Default to Service Bus
  serviceBusConnectionString: process.env.SERVICE_BUS_CONNECTION_STRING || 'your-service-bus-connection-string',
  serviceBusQueueName: process.env.SERVICE_BUS_QUEUE_NAME || 'your-service-bus-queue-name',
  sqsQueueUrl: process.env.SQS_QUEUE_URL || 'your-sqs-queue-url',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost',
  rabbitmqQueueName: process.env.RABBITMQ_QUEUE_NAME || 'your-rabbitmq-queue-name',
};

module.exports = {
  getConfig: () => {
    return {
      ...defaultConfig,
      // Add any additional configuration logic here if needed
    };
  },
};
