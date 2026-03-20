const cron = require('node-cron');
const SequenceStepShifter = require('./sequenceStepShifter');
const AzureServiceBus = require('./azureServiceBus'); // Add this line

const defaultConfig = {
  messageQueueType: 'serviceBus', // Default to Service Bus
  serviceBusConnectionString: process.env.SERVICE_BUS_CONNECTION_STRING || 'your-service-bus-connection-string',
  serviceBusQueueName: process.env.SERVICE_BUS_QUEUE_NAME || 'your-service-bus-queue-name',
  sqsQueueUrl: process.env.SQS_QUEUE_URL || 'your-sqs-queue-url',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost',
  rabbitmqQueueName: process.env.RABBITMQ_QUEUE_NAME || 'your-rabbitmq-queue-name',
  isNonBlocking: process.env.IS_NON_BLOCKING === 'true' || false, // Add this line
  openaiApiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key', // Add this line
  azureAcsConnectionString: process.env.AZURE_ACS_CONNECTION_STRING || 'your-azure-acs-connection-string', // Add this line
  azureAcsQueueName: process.env.AZURE_ACS_QUEUE_NAME || 'your-azure-acs-queue-name', // Add this line
  geographicRoutingEnabled: process.env.GEOGRAPHIC_ROUTING_ENABLED === 'true' || false, // Add this line
  geographicRoutingRegion: process.env.GEOGRAPHIC_ROUTING_REGION || 'us', // Add this line
  timeBlockCheckEnabled: process.env.TIME_BLOCK_CHECK_ENABLED === 'true' || false, // Add this line
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
};
