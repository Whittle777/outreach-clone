const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Migration = require('../services/migration');
const BackupService = require('../services/backup');
const config = require('../config');

describe('Migration Tests', () => {
  let migration;
  let backupService;

  beforeAll(async () => {
    migration = new Migration();
    backupService = new BackupService();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should migrate prospects without downtime', async () => {
    // Create a backup before starting the migration
    await backupService.createBackup();

    // Fetch all prospects from the legacy datastore
    const legacyProspects = await migration.fetchLegacyProspects();

    // Migrate each prospect to the new datastore using double-write strategy
    for (const prospect of legacyProspects) {
      await migration.doubleWriteStrategy.write({
        type: 'prospect',
        data: {
          firstName: prospect.firstName,
          lastName: prospect.lastName,
          email: prospect.email,
          companyName: prospect.companyName,
          status: prospect.status,
          phoneNumber: prospect.phoneNumber,
        },
      });
    }

    // Verify that all prospects are migrated correctly
    const newProspects = await prisma.voiceAgentCall.findMany();
    expect(newProspects.length).toBe(legacyProspects.length);

    for (let i = 0; i < legacyProspects.length; i++) {
      expect(newProspects[i].firstName).toBe(legacyProspects[i].firstName);
      expect(newProspects[i].lastName).toBe(legacyProspects[i].lastName);
      expect(newProspects[i].email).toBe(legacyProspects[i].email);
      expect(newProspects[i].companyName).toBe(legacyProspects[i].companyName);
      expect(newProspects[i].status).toBe(legacyProspects[i].status);
      expect(newProspects[i].phoneNumber).toBe(legacyProspects[i].phoneNumber);
    }

    console.log('Prospect migration completed successfully.');
  });
});
