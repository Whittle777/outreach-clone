// services/openRateAnalyzer.test.js

const { PrismaClient } = require('@prisma/client');
const { analyzeOpenRates } = require('./openRateAnalyzer');

const prisma = new PrismaClient();

jest.mock('@prisma/client');

describe('analyzeOpenRates', () => {
  it('should calculate and log the open rate for a prospect', async () => {
    const messages = [
      { prospectId: '123', bento: 'default' },
    ];

    prisma['shard_0'].trackingPixelEvent.findMany.mockResolvedValue([
      { prospectId: '123' },
    ]);

    prisma['shard_0'].prospect.count.mockResolvedValue(1);

    await analyzeOpenRates(messages);

    expect(prisma['shard_0'].trackingPixelEvent.findMany).toHaveBeenCalledWith({
      where: { prospectId: '123' },
    });

    expect(prisma['shard_0'].prospect.count).toHaveBeenCalledWith({
      where: { id: '123' },
    });

    // Log output is checked using console.log mock
    const logSpy = jest.spyOn(console, 'log');
    logSpy.mockImplementation(() => {});

    await analyzeOpenRates(messages);

    expect(logSpy).toHaveBeenCalledWith('Open rate for prospectId 123: 100.00%');
    logSpy.mockRestore();
  });
});
