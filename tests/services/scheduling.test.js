const { scheduleSequence } = require('../services/scheduling');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockReturnValue({
    shard_0: {
      sequence: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      sequenceStep: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
    },
  }),
}));

jest.mock('../config/kafka', () => ({
  producer: jest.fn().mockReturnThis(),
}));

describe('Scheduling Service', () => {
  let producer;

  beforeEach(() => {
    producer = {
      send: jest.fn(),
    };

    jest.spyOn(kafka, 'producer').mockReturnValue(producer);
  });

  it('should schedule a sequence and produce a message to the sequence-scheduled topic', async () => {
    const sequenceId = 1;
    const bento = 'bento1';
    const sequence = {
      id: sequenceId,
      interval: 'daily',
      nextRun: new Date(),
    };

    prisma.shard_0.sequence.findUnique.mockResolvedValue(sequence);

    await scheduleSequence(sequenceId, bento);

    expect(prisma.shard_0.sequence.update).toHaveBeenCalledWith({
      where: { id: sequenceId },
      data: { nextRun: expect.any(Date) },
    });

    expect(prisma.shard_0.sequenceStep.findMany).toHaveBeenCalledWith({
      where: { sequenceId },
      orderBy: { order: 'asc' },
    });

    expect(producer.send).toHaveBeenCalledWith({
      topic: 'sequence-scheduled',
      messages: [
        {
          value: JSON.stringify({ sequenceId, bento, nextRun: expect.any(Date) }),
        },
      ],
    });
  });
});
