const config = {
  messageBroker: process.env.MESSAGE_BROKER || 'azure-service-bus',
  azureServiceBus: {
    connectionString: process.env.AZURE_SERVICE_BUS_CONNECTION_STRING,
    topicName: process.env.AZURE_SERVICE_BUS_TOPIC_NAME,
  },
  awsSqs: {
    queueUrl: process.env.AWS_SQS_QUEUE_URL,
  },
  rabbitMQ: {
    url: process.env.RABBITMQ_URL,
    queueName: process.env.RABBITMQ_QUEUE_NAME,
  },
  emailService: {
    retryLimit: parseInt(process.env.EMAIL_RETRY_LIMIT) || 5,
    backoffInterval: parseInt(process.env.EMAIL_BACKOFF_INTERVAL) || 1000, // in milliseconds
  },
};

module.exports = config;
