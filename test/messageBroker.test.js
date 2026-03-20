const { expect } = require('chai');
const sinon = require('sinon');
const AzureServiceBus = require('../messageBroker/azureServiceBus');
const RabbitMQService = require('../messageBroker/rabbitmqService');
const config = require('../config/settings');
const jwt = require('jsonwebtoken');

describe('Message Broker Tests', () => {
  let azureServiceBus;
  let rabbitmqService;

  beforeEach(() => {
    azureServiceBus = new AzureServiceBus(config);
    rabbitmqService = new RabbitMQService(config);
  });

  describe('AzureServiceBus Tests', () => {
    it('should send a message to Azure Service Bus', async () => {
      const message = { test: 'message' };
      const token = jwt.sign({ isFleetCommandCenterUser: true }, process.env.JWT_SECRET);

      const sendMessageStub = sinon.stub(azureServiceBus.sender, 'sendMessages').resolves();
      const addLogStub = sinon.stub(azureServiceBus.realTimeReasoningLogs, 'addLog').resolves();

      await azureServiceBus.sendMessage(message, token);

      expect(sendMessageStub.calledOnceWith({ body: message })).to.be.true;
      expect(addLogStub.calledOnceWith('sendMessage', `Message sent to Azure Service Bus: ${JSON.stringify(message)}`)).to.be.true;
    });

    it('should receive a message from Azure Service Bus', async () => {
      const message = { test: 'message' };
      const token = jwt.sign({ isFleetCommandCenterUser: true }, process.env.JWT_SECRET);

      const receiveMessagesStub = sinon.stub(azureServiceBus.receiver, 'receiveMessages').resolves([{ body: message }]);
      const addLogStub = sinon.stub(azureServiceBus.realTimeReasoningLogs, 'addLog').resolves();

      const receivedMessage = await azureServiceBus.receiveMessage(token);

      expect(receivedMessage).to.deep.equal(message);
      expect(receiveMessagesStub.calledOnceWith(1)).to.be.true;
      expect(addLogStub.calledOnceWith('receiveMessage', `Message received from Azure Service Bus: ${JSON.stringify(message)}`)).to.be.true;
    });

    // Add more tests for other methods as needed
  });

  describe('RabbitMQService Tests', () => {
    it('should send a message to RabbitMQ', async () => {
      const message = { test: 'message' };
      const token = jwt.sign({ isFleetCommandCenterUser: true }, process.env.JWT_SECRET);

      const sendMessageStub = sinon.stub(rabbitmqService.channel, 'sendToQueue').resolves();
      const addLogStub = sinon.stub(rabbitmqService.realTimeReasoningLogs, 'addLog').resolves();

      await rabbitmqService.sendMessage(message, token);

      expect(sendMessageStub.calledOnceWith(config.queueName, Buffer.from(JSON.stringify(message)))).to.be.true;
      expect(addLogStub.calledOnceWith('sendMessage', `Message sent to RabbitMQ: ${JSON.stringify(message)}`)).to.be.true;
    });

    it('should receive a message from RabbitMQ', async () => {
      const message = { test: 'message' };
      const token = jwt.sign({ isFleetCommandCenterUser: true }, process.env.JWT_SECRET);

      const getMessageStub = sinon.stub(rabbitmqService.channel, 'get').resolves({ content: Buffer.from(JSON.stringify(message)) });
      const addLogStub = sinon.stub(rabbitmqService.realTimeReasoningLogs, 'addLog').resolves();

      const receivedMessage = await rabbitmqService.receiveMessage(token);

      expect(receivedMessage).to.deep.equal(message);
      expect(getMessageStub.calledOnceWith(config.queueName, { noAck: true })).to.be.true;
      expect(addLogStub.calledOnceWith('receiveMessage', `Message received from RabbitMQ: ${JSON.stringify(message)}`)).to.be.true;
    });

    // Add more tests for other methods as needed
  });
});
