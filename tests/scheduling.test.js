const { scheduleSequence } = require('../services/scheduling');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Scheduling Service', () => {
  beforeAll(async () => {
    // Seed the database with test data
    await prisma.sequence.create({
      data: {
        id: 1,
        interval: 'daily',
        nextRun: new Date('2023-10-01T00:00:00Z'),
        bento: 1,
      },
    });

    await prisma.sequenceStep.create({
      data: {
        id: 1,
        sequenceId: 1,
        order: 1,
        delayDays: 5,
        subject: 'Test Subject',
        body: 'Test Body',
        bento: 1,
      },
    });
  });

  afterAll(async () => {
    // Clean up the database after tests
    await prisma.sequence.delete({ where: { id: 1 } });
    await prisma.sequenceStep.delete({ where: { id: 1 } });
  });

  describe('scheduleSequence', () => {
    it('should update the nextRun time for a sequence', async () => {
      const sequenceId = 1;
      const bento = 1;
      const expectedNextRun = new Date('2023-10-02T00:00:00Z');

      const nextRun = await scheduleSequence(sequenceId, bento);
      expect(nextRun).toEqual(expectedNextRun);
    });

    it('should update the scheduledTime for sequence steps', async () => {
      const sequenceId = 1;
      const bento = 1;
      const expectedScheduledTime = new Date('2023-10-06T00:00:00Z');

      await scheduleSequence(sequenceId, bento);
      const sequenceStep = await prisma.sequenceStep.findUnique({ where: { id: 1 } });
      expect(sequenceStep.scheduledTime).toEqual(expectedScheduledTime);
    });
  });
});
