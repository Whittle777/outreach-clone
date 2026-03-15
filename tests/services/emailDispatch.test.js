const { run } = require('../services/emailDispatch');
const { Kafka } = require('kafkajs');
const { handleProspectStatusChange } = require('../services/eventHandlers');

jest.mock('../services/eventHandlers', () => ({
  handleProspectStatusChange: jest.fn(),
}));

jest.mock('kafkajs', () => ({
  Kafka: jest.fn().mockReturnValue({
    producer: jest.fn().mockReturnThis(),
    consumer: jest.fn().mockReturnThis(),
  }),
}));

describe('Email Dispatch Service', () => {
  let producer;
  let consumer;

  beforeEach(async () => {
    producer = {
      connect: jest.fn(),
      send: jest.fn(),
    };

    consumer = {
      connect: jest.fn(),
      subscribe: jest.fn(),
      run: jest.fn(),
    };

    jest.spyOn(kafka, 'producer').mockReturnValue(producer);
    jest.spyOn(kafka, 'consumer').mockReturnValue(consumer);
  });

  it('should process email dispatch request and produce a message to the email-dispatched topic', async () => {
    const message = {
      value: JSON.stringify({ prospectId: 1, bento: 'bento1', newStatus: 'dispatched' }),
    };

    await run();

    expect(consumer.run).toHaveBeenCalledWith({
      eachMessage: expect.any(Function),
    });

    await consumer.run.mock.calls[0][0].eachMessage({
      topic: 'email-dispatch-requests',
      partition: 0,
      message,
    });

    expect(handleProspectStatusChange).toHaveBeenCalledWith(1, 'bento1', 'dispatched');
    expect(producer.send).toHaveBeenCalledWith({
      topic: 'email-dispatched',
      messages: [
        {
          value: JSON.stringify({ prospectId: 1, bento: 'bento1', newStatus: 'dispatched' }),
        },
      ],
    });
  });
});
