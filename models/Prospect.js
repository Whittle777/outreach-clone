const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createProspect(firstName, lastName, email, companyName, status, bento) {
  const shard = getShard(bento);
  return await prisma[shard].prospect.create({
    data: {
      firstName,
      lastName,
      email,
      companyName,
      status,
      bento,
    },
  });
}

async function getProspectById(id, bento) {
  const shard = getShard(bento);
  return await prisma[shard].prospect.findUnique({
    where: { id },
  });
}

async function getAllProspects(bento) {
  const shard = getShard(bento);
  return await prisma[shard].prospect.findMany({
    where: { bento },
  });
}

async function updateProspect(id, firstName, lastName, email, companyName, status, bento) {
  const shard = getShard(bento);
  return await prisma[shard].prospect.update({
    where: { id },
    data: { firstName, lastName, email, companyName, status, bento },
  });
}

async function deleteProspect(id, bento) {
  const shard = getShard(bento);
  return await prisma[shard].prospect.delete({
    where: { id },
  });
}

function getShard(bento) {
  // Simple sharding logic based on bento value
  // For example, you can use a hash function or a modulo operation
  return `shard_${bento % 3}`;
}

module.exports = {
  createProspect,
  getProspectById,
  getAllProspects,
  updateProspect,
  deleteProspect,
};
