const assert = require('assert');
const RabbitMQ = require('../messageBroker/rabbitMQ');
const AzureServiceBus = require('../messageBroker/azureServiceBus');
const AwsSqs = require('../messageBroker/awsSqs');
const azureServiceBusProducer = require('../services/azureServiceBusProducer');
const rabbitMQProducer = require('../services/rabbitMQProducer');
const mcp = require('../services/mcp');
const config = require('../config');

describe('Teams Phone Integration Tests', function() {
  let rabbitMQ;
  let azureServiceBus;
  let awsSqs;

  before(async function() {
    rabbitMQ = new RabbitMQ(config.rabbitMQ);
    azureServiceBus = new AzureServiceBus(config.azureServiceBus);
    awsSqs = new AwsSqs(config.awsSqs);
  });

  after(async function() {
    await rabbitMQ.close();
    await azureServiceBus.close();
  });

  describe('RabbitMQ Integration', function() {
    it('should send and receive a message', async function() {
      const message = { test: 'RabbitMQ' };
      await rabbitMQ.sendMessage(JSON.stringify(message));
      const receivedMessage = await rabbitMQ.receiveMessage();
      assert.deepStrictEqual(JSON.parse(receivedMessage), message);
    });

    it('should send a message with MCP encryption and signature', async function() {
      const message = { test: 'RabbitMQ with MCP' };
      const encryptedMessage = mcp.encrypt(JSON.stringify(message));
      const signature = mcp.sign(encryptedMessage);
      await rabbitMQ.sendMessage(JSON.stringify({ encryptedMessage, signature }));
      const receivedMessage = await rabbitMQ.receiveMessage();
      const receivedData = JSON.parse(receivedMessage);
      const decryptedMessage = mcp.decrypt(receivedData.encryptedMessage);
      assert.deepStrictEqual(JSON.parse(decryptedMessage), message);
      assert.ok(mcp.verify(decryptedMessage, receivedData.signature));
    });
  });

  describe('Azure Service Bus Integration', function() {
    it('should send and receive a message', async function() {
      const message = { test: 'Azure Service Bus' };
      await azureServiceBus.sendMessage(JSON.stringify(message));
      const receivedMessage = await azureServiceBus.receiveMessage();
      assert.deepStrictEqual(JSON.parse(receivedMessage), message);
    });

    it('should send a message with Microsoft Entra Object ID', async function() {
      const message = { test: 'Azure Service Bus with Entra Object ID' };
      const entraObjectId = '12345-67890';
      await azureServiceBus.sendMessageWithEntraObjectId(JSON.stringify(message), entraObjectId);
      const receivedMessage = await azureServiceBus.receiveMessage();
      const receivedData = JSON.parse(receivedMessage);
      assert.deepStrictEqual(receivedData, { ...message, entraObjectId });
    });
  });

  describe('AWS SQS Integration', function() {
    it('should send and receive a message', async function() {
      const message = { test: 'AWS SQS' };
      await awsSqs.sendMessage(JSON.stringify(message));
      const receivedMessage = await awsSqs.receiveMessage();
      assert.deepStrictEqual(JSON.parse(receivedMessage), message);
    });
  });
});
