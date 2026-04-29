const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.user.upsert({
      where: { email: 'admin@outreach.clone' },
      update: {},
      create: {
        id: 1,
        email: 'admin@outreach.clone',
        username: 'admin',
        password: 'password_hash_dummy'
      }
    });
    console.log('Successfully seeded admin user ID: 1');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
