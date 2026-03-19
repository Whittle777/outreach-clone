const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function searchProspects(query) {
  if (!query) {
    return [];
  }

  const prospects = await prisma.prospect.findMany({
    where: {
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { companyName: { contains: query, mode: 'insensitive' } },
      ],
    },
  });

  return prospects;
}

module.exports = {
  searchProspects,
};
