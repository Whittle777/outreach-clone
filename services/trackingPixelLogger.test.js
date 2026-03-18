// services/trackingPixelLogger.test.js

const { PrismaClient } = require('@prisma/client');
const { logTrackingPixelEvent } = require('./trackingPixelLogger');

const prisma = new PrismaClient();

jest.mock('@prisma/client');

describe('logTrackingPixelEvent', () => {
  it('should log a tracking pixel event correctly', async () => {
    const prospectId = '123';
    const bento = 'default';
    const trackingPixelData = 'tracking data';

    prisma['shard_0'].trackingPixelEvent.create.mockResolvedValue({
      prospectId,
      bento,
      trackingPixelData,
    });

    await logTrackingPixelEvent(prospectId, bento, trackingPixelData);

    expect(prisma['shard_0'].trackingPixelEvent.create).toHaveBeenCalledWith({
      data: {
        prospectId,
        bento,
        trackingPixelData,
      },
    });
  });
});
