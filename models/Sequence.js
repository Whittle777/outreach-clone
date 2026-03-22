const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSequence(userId, name, bento, schemaTag = "default", interval = null, nextRun = null) {
  const shard = getShard(bento);
  return await prisma[shard].sequence.create({
    data: {
      userId,
      name,
      bento,
      schemaTag,
      interval,
      nextRun,
    },
  });
}

async function getSequenceById(id, bento) {
  const shard = getShard(bento);
  return await prisma[shard].sequence.findUnique({
    where: { id },
    include: { steps: true },
  });
}

async function getSequencesByUserId(userId, bento) {
  const shard = getShard(bento);
  return await prisma[shard].sequence.findMany({
    where: { userId },
  });
}

async function updateSequence(id, name, bento, schemaTag = "default", interval = null, nextRun = null) {
  const shard = getShard(bento);
  return await prisma[shard].sequence.update({
    where: { id },
    data: { name, bento, schemaTag, interval, nextRun },
  });
}

async function deleteSequence(id, bento) {
  const shard = getShard(bento);
  return await prisma[shard].sequence.delete({
    where: { id },
  });
}

async function updateTimeShiftForSequence(id, bento, timeShift) {
  const shard = getShard(bento);
  const sequence = await prisma[shard].sequence.findUnique({
    where: { id },
  });

  if (!sequence) {
    throw new Error('Sequence not found');
  }

  const newNextRun = new Date(sequence.nextRun.getTime() + timeShift);
  return await prisma[shard].sequence.update({
    where: { id },
    data: { nextRun: newNextRun },
  });
}

function getShard(bento) {
  // Simple sharding logic based on bento value
  // For example, you can use a hash function or a modulo operation
  return `shard_${bento % 3}`;
}

module.exports = {
  createSequence,
  getSequenceById,
  getSequencesByUserId,
  updateSequence,
  deleteSequence,
  updateTimeShiftForSequence,
};
