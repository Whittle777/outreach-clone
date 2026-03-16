const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createProspect(firstName, lastName, email, companyName, status, bento, dmarcPolicy = 'none', trackingPixelData = null) {
  const shard = getShard(bento);
  return await prisma[shard].prospect.create({
    data: {
      firstName,
      lastName,
      email,
      companyName,
      status,
      bento,
      dmarcPolicy,
      trackingPixelData,
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

async function updateProspect(id, { firstName, lastName, email, companyName, status, dmarcPolicy, trackingPixelData }, bento) {
  const shard = getShard(bento);
  return await prisma[shard].prospect.update({
    where: { id },
    data: { firstName, lastName, email, companyName, status, dmarcPolicy, trackingPixelData },
  });
}

async function deleteProspect(id, bento) {
  const shard = getShard(bento);
  return await prisma[shard].prospect.delete({
    where: { id },
  });
}

async function getProspectUserId(prospectId, bento) {
  const shard = getShard(bento);
  const prospect = await prisma[shard].prospect.findUnique({
    where: { id: prospectId },
    include: { user: true },
  });
  return prospect ? prospect.userId : null;
}

async function updateProspectStatus(prospectId, bento, newStatus) {
  const shard = getShard(bento);
  return await prisma[shard].prospect.update({
    where: { id: prospectId },
    data: { status: newStatus },
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
  getProspectUserId,
  updateProspectStatus,
};
