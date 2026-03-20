const cron = require('node-cron');
const SequenceStepShifter = require('./sequenceStepShifter');
const AzureServiceBus = require('./azureServiceBus');
const AwsSqs = require('./awsSqs');
const RabbitMQService = require('./rabbitmq/rabbitmqService');
const NLP = require('./nlp');
const IntentDrivenShortcuts = require('./intentDrivenShortcuts');

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
  microsoftEntra: {
    clientId: process.env.MICROSOFT_ENTRA_CLIENT_ID || 'your-client-id',
    clientSecret: process.env.MICROSOFT_ENTRA_CLIENT_SECRET || 'your-client-secret',
    tenantId: process.env.MICROSOFT_ENTRA_TENANT_ID || 'your-tenant-id'
  },
  stirShakenEnabled: process.env.STIR_SHAKEN_ENABLED === 'true' || false,
  stirShakenApiUrl: process.env.STIR_SHAKEN_API_URL || 'https://stirshakenapi.com/check',
  stirShakenApiKey: process.env.STIR_SHAKEN_API_KEY || 'your-stir-shaken-api-key',
  rateLimits: {
    teamsPhoneNumbers: {
      '1234567890': {
        limit: 10,
        duration: 60
      },
      '0987654321': {
        limit: 15,
        duration: 60
      }
    },
    dialing: {
      limit: process.env.DIALING_LIMIT || 20,
      duration: process.env.DIALING_DURATION || 300
    }
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true' || false,
    auth: {
      user: process.env.EMAIL_USER || 'your-email-user',
      pass: process.env.EMAIL_PASS || 'your-email-password',
    },
    maxRetries: process.env.EMAIL_MAX_RETRIES || 3,
    backoffTime: process.env.EMAIL_BACKOFF_TIME || 1000, // 1 second
  },
  predictiveSearch: {
    enabled: process.env.PREDICTIVE_SEARCH_ENABLED === 'true' || false,
    // Add any additional configuration for predictive search here
  }
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
  initializeMessageBroker: () => {
    const config = require('./config').getConfig();
    switch (config.messageQueueType) {
      case 'azureServiceBus':
        return new AzureServiceBus(config);
      case 'awsSqs':
        return new AwsSqs(config);
      case 'rabbitmq':
        return new RabbitMQService(config.rabbitmq);
      default:
        throw new Error('Invalid message queue type');
    }
  },
  initializeNLP: () => {
    const config = require('./config').getConfig();
    return new NLP(config);
  },
  initializeIntentDrivenShortcuts: () => {
    const config = require('./config').getConfig();
    return new IntentDrivenShortcuts(config);
  },
};
