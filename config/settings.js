module.exports = {
  messageBroker: 'azure-service-bus', // or 'aws-sqs', 'rabbitmq'
  azureServiceBus: {
    connectionString: 'your-azure-service-bus-connection-string',
    topicName: 'your-topic-name',
    subscriptionName: 'your-subscription-name',
  },
  awsSqs: {
    queueUrl: 'your-aws-sqs-queue-url',
  },
  rabbitMQ: {
    url: 'your-rabbitmq-url',
    queueName: 'your-queue-name',
  },
  rateLimits: {
    teamsPhoneNumbers: {
      '123-456-7890': { limit: 10, duration: 60 }, // Example rate limit for a Teams phone number
      '987-654-3210': { limit: 20, duration: 60 }, // Another example rate limit for a Teams phone number
    },
  },
};
