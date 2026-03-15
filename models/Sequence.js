const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSequence(userId, name, bento, schemaTag) {
  const shard = getShard(bento);
  return await prisma[shard].sequence.create({
    data: {
      userId,
      name,
      bento,
      schemaTag,
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

async function updateSequence(id, name, bento, schemaTag) {
  const shard = getShard(bento);
  return await prisma[shard].sequence.update({
    where: { id },
    data: { name, bento, schemaTag },
  });
}

async function deleteSequence(id, bento) {
  const shard = getShard(bento);
  return await prisma[shard].sequence.delete({
    where: { id },
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
  updateSequence,
  deleteSequence,
};
