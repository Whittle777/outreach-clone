const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class Migration {
  async migrateProspects() {
    try {
      // Fetch all prospects from the legacy datastore
      const legacyProspects = await this.fetchLegacyProspects();

      // Migrate each prospect to the new datastore
      for (const prospect of legacyProspects) {
        await prisma.prospect.create({
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

      console.log('Prospect migration completed successfully.');
    } catch (error) {
      console.error('Error during prospect migration:', error);
    }
  }

  async fetchLegacyProspects() {
    // Implement logic to fetch prospects from the legacy datastore
    // For now, let's assume it's a no-op and return some dummy data
    return [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        companyName: 'Example Corp',
        status: 'Uncontacted',
        phoneNumber: '123-456-7890',
      },
    ];
  }
}

module.exports = Migration;
