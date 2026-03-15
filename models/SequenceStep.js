const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSequenceStep(sequenceId, order, delayDays, subject, body, bento) {
  const shard = getShard(bento);
  return await prisma[shard].sequenceStep.create({
    data: {
      sequenceId,
      order,
      delayDays,
      subject,
      body,
      bento,
      schemaTag: 'v1', // Add schema tagging
    },
  });
}

async function getSequenceStepsBySequenceId(sequenceId, bento) {
  const shard = getShard(bento);
  return await prisma[shard].sequenceStep.findMany({
    where: { sequenceId },
  });
}

async function updateSequenceStep(id, order, delayDays, subject, body, bento) {
  const shard = getShard(bento);
  return await prisma[shard].sequenceStep.update({
    where: { id },
    data: { order, delayDays, subject, body, bento, schemaTag: 'v1' }, // Add schema tagging
  });
}

async function deleteSequenceStep(id, bento) {
  const shard = getShard(bento);
  return await prisma[shard].sequenceStep.delete({
    where: { id },
  });
}

function getShard(bento) {
  // Simple sharding logic based on bento value
  // For example, you can use a hash function or a modulo operation
  return `shard_${bento % 3}`;
}

module.exports = {
  createSequenceStep,
  getSequenceStepsBySequenceId,
  updateSequenceStep,
  deleteSequenceStep,
};
