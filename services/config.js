const cron = require('node-cron');
const SequenceStepShifter = require('./sequenceStepShifter');
const AzureServiceBus = require('./azureServiceBus');
const RabbitMQService = require('./rabbitmq/rabbitmqService');

const defaultConfig = {
  messageQueueType: 'rabbitmq', // Default to RabbitMQ
  serviceBusConnectionString: process.env.SERVICE_BUS_CONNECTION_STRING || 'your-service-bus-connection-string',
  serviceBusQueueName: process.env.SERVICE_BUS_QUEUE_NAME || 'your-service-bus-queue-name',
  sqsQueueUrl: process.env.SQS_QUEUE_URL || 'your-sqs-queue-url',
  rabbitmq: {
    connectionString: process.env.RABBITMQ_CONNECTION_STRING || 'amqp://localhost:5672',
    queueName: process.env.RABBITMQ_QUEUE_NAME || 'voice-agent-queue'
  },
  isNonBlocking: process.env.IS_NON_BLOCKING === 'true' || false,
  openaiApiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key',
  azureAcsConnectionString: process.env.AZURE_ACS_CONNECTION_STRING || 'your-azure-acs-connection-string',
  azureAcsQueueName: process.env.AZURE_ACS_QUEUE_NAME || 'your-azure-acs-queue-name',
  geographicRoutingEnabled: process.env.GEOGRAPHIC_ROUTING_ENABLED === 'true' || false,
  geographicRoutingRegion: process.env.GEOGRAPHIC_ROUTING_REGION || 'us',
  timeBlockCheckEnabled: process.env.TIME_BLOCK_CHECK_ENABLED === 'true' || false,
};

module.exports = {
  getConfig: () => {
    return {
      ...defaultConfig,
      // Add any additional configuration logic here if needed
    };
  },
  initializeCronJobs: () => {
    const config = require('./config').getConfig();
    const sequenceStepShifter = new SequenceStepShifter();
    cron.schedule(config.sequenceStepShifter.cronSchedule, () => {
      sequenceStepShifter.shiftSequenceSteps();
    });
  },
  initializeAzureServiceBus: () => {
    const config = require('./config').getConfig();
    return new AzureServiceBus(config.serviceBusConnectionString, config.serviceBusQueueName);
  },
  initializeAwsSqs: () => {
    const config = require('./config').getConfig();
    return new AwsSqs(config);
  },
  initializeRabbitMQ: () => {
    const config = require('./config').getConfig();
    return new RabbitMQService(config.rabbitmq);
  },
};
