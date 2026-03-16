const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createEmailActivity(prospectId, sequenceStepId, status, bento) {
  const shard = getShard(bento);
  return await prisma[shard].emailActivity.create({
    data: {
      prospectId,
      sequenceStepId,
      status,
      bento,
    },
  });
}

async function getEmailActivitiesByProspectId(prospectId, bento) {
  const shard = getShard(bento);
  return await prisma[shard].emailActivity.findMany({
    where: { prospectId },
  });
}

async function getEmailActivitiesBySequenceStepId(sequenceStepId, bento) {
  const shard = getShard(bento);
  return await prisma[shard].emailActivity.findMany({
    where: { sequenceStepId },
  });
}

async function updateEmailActivity(id, status, bento) {
  const shard = getShard(bento);
  return await prisma[shard].emailActivity.update({
    where: { id },
    data: { status },
  });
}

async function deleteEmailActivity(id, bento) {
  const shard = getShard(bento);
  return await prisma[shard].emailActivity.delete({
    where: { id },
  });
}

function getShard(bento) {
  // Simple sharding logic based on bento value
  // For example, you can use a hash function or a modulo operation
  return `shard_${bento % 3}`;
}

module.exports = {
  createEmailActivity,
  getEmailActivitiesByProspectId,
  getEmailActivitiesBySequenceStepId,
  updateEmailActivity,
  deleteEmailActivity,
};
