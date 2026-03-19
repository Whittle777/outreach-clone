const assert = require('assert');
const RabbitMQ = require('../messageBroker/rabbitMQ');
const AwsSqs = require('../messageBroker/awsSqs');
const AzureServiceBus = require('../messageBroker/azureServiceBus');
const logger = require('../services/logger');
const config = require('../config/settings');

// Mock JWT token for testing
const mockToken = 'mock-jwt-token';

// Mock RabbitMQ configuration
const rabbitMQConfig = {
  url: 'amqp://localhost',
  queueName: 'test-queue',
};

// Mock AWS SQS configuration
const awsSqsConfig = {
  queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue',
};

// Mock Azure Service Bus configuration
const azureServiceBusConfig = {
  connectionString: 'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=mock-key',
  topicName: 'test-topic',
  subscriptionName: 'test-subscription',
};

describe('HITL Workflow End-to-End Test', function() {
  let rabbitMQ;
  let awsSqs;
  let azureServiceBus;

  before(async function() {
    rabbitMQ = new RabbitMQ(rabbitMQConfig);
    awsSqs = new AwsSqs(awsSqsConfig);
    azureServiceBus = new AzureServiceBus(azureServiceBusConfig);

    // Initialize RabbitMQ
    await rabbitMQ.init();

    // Initialize AWS SQS
    await awsSqs.init();

    // Initialize Azure Service Bus
    await azureServiceBus.init();
  });

  after(async function() {
    // Close RabbitMQ connection
    await rabbitMQ.close();

    // Close AWS SQS connection
    await awsSqs.close();

    // Close Azure Service Bus connection
    await azureServiceBus.close();
  });

  it('should test RabbitMQ message sending and receiving', async function() {
    const message = { test: 'RabbitMQ' };
    await rabbitMQ.sendMessage(message, mockToken);
    const receivedMessage = await rabbitMQ.receiveMessage(mockToken);
    assert.deepStrictEqual(receivedMessage, message);
  });

  it('should test AWS SQS message sending and receiving', async function() {
    const message = { test: 'AWS SQS' };
    await awsSqs.sendMessage(message, mockToken);
    const receivedMessage = await awsSqs.receiveMessage(mockToken);
    assert.deepStrictEqual(receivedMessage, message);
  });

  it('should test Azure Service Bus message sending and receiving', async function() {
    const message = { test: 'Azure Service Bus' };
    await azureServiceBus.sendMessage(message, mockToken);
    const receivedMessage = await azureServiceBus.receiveMessage(mockToken);
    assert.deepStrictEqual(receivedMessage, message);
  });

  it('should test rate limiting with RabbitMQ', async function() {
    const message = { test: 'Rate Limiting' };
    const prospectId = '123';
    const phoneNumber = '1234567890';

    for (let i = 0; i < config.rateLimits.teamsPhoneNumbers[phoneNumber].limit; i++) {
      await rabbitMQ.sendMessageWithRateLimit(message, prospectId, phoneNumber, mockToken);
    }

    try {
      await rabbitMQ.sendMessageWithRateLimit(message, prospectId, phoneNumber, mockToken);
      assert.fail('Expected rate limit exceeded error');
    } catch (error) {
      assert.strictEqual(error.message, 'Rate limit exceeded');
    }
  });

  it('should test rate limiting with AWS SQS', async function() {
    const message = { test: 'Rate Limiting' };
    const prospectId = '123';
    const phoneNumber = '1234567890';

    for (let i = 0; i < config.rateLimits.teamsPhoneNumbers[phoneNumber].limit; i++) {
      await awsSqs.sendMessageWithRateLimit(message, prospectId, phoneNumber, mockToken);
    }

    try {
      await awsSqs.sendMessageWithRateLimit(message, prospectId, phoneNumber, mockToken);
      assert.fail('Expected rate limit exceeded error');
    } catch (error) {
      assert.strictEqual(error.message, 'Rate limit exceeded');
    }
  });

  it('should test rate limiting with Azure Service Bus', async function() {
    const message = { test: 'Rate Limiting' };
    const prospectId = '123';
    const phoneNumber = '1234567890';

    for (let i = 0; i < config.rateLimits.teamsPhoneNumbers[phoneNumber].limit; i++) {
      await azureServiceBus.sendMessageWithRateLimit(message, prospectId, phoneNumber, mockToken);
    }

    try {
      await azureServiceBus.sendMessageWithRateLimit(message, prospectId, phoneNumber, mockToken);
      assert.fail('Expected rate limit exceeded error');
    } catch (error) {
      assert.strictEqual(error.message, 'Rate limit exceeded');
    }
  });
});
