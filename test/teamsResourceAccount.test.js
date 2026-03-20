const { createTeamsResourceAccount, getTeamsResourceAccount, initiateOutboundCall } = require('../services/teamsResourceAccount');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Teams Resource Account Integration Tests', () => {
  const userId = 'mockUserId';
  const bento = 1;
  const phoneNumber = '1234567890';

  beforeEach(async () => {
    await prisma.teamsResourceAccount.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a mock Teams Resource Account', async () => {
    const account = await createTeamsResourceAccount(userId, bento, true);
    expect(account.userId).toBe(userId);
    expect(account.bento).toBe(bento);
    expect(account.isMock).toBe(true);
  });

  it('should get a mock Teams Resource Account', async () => {
    await createTeamsResourceAccount(userId, bento, true);
    const account = await getTeamsResourceAccount(userId, bento);
    expect(account.userId).toBe(userId);
    expect(account.bento).toBe(bento);
    expect(account.isMock).toBe(true);
  });

  it('should initiate a mock outbound call', async () => {
    await createTeamsResourceAccount(userId, bento, true);
    const call = await initiateOutboundCall(userId, bento, phoneNumber);
    expect(call.status).toBe('mock call initiated');
    expect(call.phoneNumber).toBe(phoneNumber);
  });
});
