const { handleProspectStatusChange } = require('../services/stateMachine');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockReturnValue({
    shard_0: {
      prospect: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    },
  }),
}));

describe('State Machine Service', () => {
  it('should handle prospect status change and update the prospect status', async () => {
    const prospectId = 1;
    const bento = 'bento1';
    const newStatus = 'dispatched';
    const prospect = {
      id: prospectId,
      status: 'pending',
    };

    prisma.shard_0.prospect.findUnique.mockResolvedValue(prospect);

    await handleProspectStatusChange(prospectId, bento, newStatus);

    expect(prisma.shard_0.prospect.update).toHaveBeenCalledWith({
      where: { id: prospectId },
      data: { status: newStatus },
    });
  });

  it('should log a message if the prospect status is already up to date', async () => {
    const prospectId = 1;
    const bento = 'bento1';
    const newStatus = 'pending';
    const prospect = {
      id: prospectId,
      status: newStatus,
    };

    prisma.shard_0.prospect.findUnique.mockResolvedValue(prospect);

    await handleProspectStatusChange(prospectId, bento, newStatus);

    expect(prisma.shard_0.prospect.update).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Prospect status is already up to date');
  });
});
