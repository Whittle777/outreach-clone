const { handleProspectStatusChange } = require('../services/stateMachine');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        shard_0: {
          prospect: {
            findUnique: jest.fn(),
            update: jest.fn(),
          },
        },
      };
    }),
  };
});

describe('handleProspectStatusChange', () => {
  let prospectId;
  let bento;
  let newStatus;

  beforeEach(() => {
    prospectId = '123';
    bento = 0;
    newStatus = 'Active';
  });

  it('should throw an error if prospect is not found', async () => {
    prisma.shard_0.prospect.findUnique.mockResolvedValue(null);

    await expect(handleProspectStatusChange(prospectId, bento, newStatus)).rejects.toThrow('Prospect not found');
  });

  it('should log a message if prospect status is already up to date', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    prisma.shard_0.prospect.findUnique.mockResolvedValue({ id: prospectId, status: newStatus });

    await handleProspectStatusChange(prospectId, bento, newStatus);

    expect(consoleSpy).toHaveBeenCalledWith('Prospect status is already up to date');
    consoleSpy.mockRestore();
  });

  it('should update prospect status and log the change', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    prisma.shard_0.prospect.findUnique.mockResolvedValue({ id: prospectId, status: 'Pending' });
    prisma.shard_0.prospect.update.mockResolvedValue({ id: prospectId, status: newStatus });

    await handleProspectStatusChange(prospectId, bento, newStatus);

    expect(prisma.shard_0.prospect.update).toHaveBeenCalledWith({
      where: { id: prospectId },
      data: { status: newStatus },
    });
    expect(consoleSpy).toHaveBeenCalledWith('Prospect status updated from Pending to Active');
    consoleSpy.mockRestore();
  });
});
