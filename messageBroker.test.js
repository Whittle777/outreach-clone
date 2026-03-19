const MessageBroker = require('./messageBroker');
const azureServiceBus = require('./messageBroker/azureServiceBus');
const awsSqs = require('./messageBroker/awsSqs');
const rabbitMQ = require('./messageBroker/rabbitMQ');

jest.mock('./messageBroker/azureServiceBus');
jest.mock('./messageBroker/awsSqs');
jest.mock('./messageBroker/rabbitMQ');

describe('MessageBroker', () => {
  let messageBroker;

  beforeEach(() => {
    messageBroker = new MessageBroker({
      messageBroker: 'azure-service-bus',
      azureServiceBus: { connectionString: 'test-connection-string', topicName: 'test-topic' },
      awsSqs: { url: 'test-url' },
      rabbitMQ: { url: 'test-url', queueName: 'test-queue' }
    });
  });

  describe('initBroker', () => {
    it('should initialize Azure Service Bus broker', () => {
      messageBroker = new MessageBroker({
        messageBroker: 'azure-service-bus',
        azureServiceBus: { connectionString: 'test-connection-string', topicName: 'test-topic' }
      });
      expect(messageBroker.broker).toBeInstanceOf(azureServiceBus);
    });

    it('should initialize AWS SQS broker', () => {
      messageBroker = new MessageBroker({
        messageBroker: 'aws-sqs',
        awsSqs: { url: 'test-url' }
      });
      expect(messageBroker.broker).toBeInstanceOf(awsSqs);
    });

    it('should initialize RabbitMQ broker', () => {
      messageBroker = new MessageBroker({
        messageBroker: 'rabbitmq',
        rabbitMQ: { url: 'test-url', queueName: 'test-queue' }
      });
      expect(messageBroker.broker).toBeInstanceOf(rabbitMQ);
    });

    it('should throw an error for unsupported message broker', () => {
      expect(() => {
        messageBroker = new MessageBroker({
          messageBroker: 'unsupported-broker'
        });
      }).toThrow('Unsupported message broker');
    });
  });

  describe('sendMessage', () => {
    it('should call sendMessage on the broker', async () => {
      const message = 'test-message';
      await messageBroker.sendMessage(message);
      expect(messageBroker.broker.sendMessage).toHaveBeenCalledWith(message);
    });
  });

  describe('receiveMessage', () => {
    it('should call receiveMessage on the broker', async () => {
      await messageBroker.receiveMessage();
      expect(messageBroker.broker.receiveMessage).toHaveBeenCalled();
    });
  });
});
