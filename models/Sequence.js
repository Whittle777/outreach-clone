const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSequence(userId, name) {
  return await prisma.sequence.create({
    data: {
      userId,
      name,
    },
  });
}

async function getSequenceById(id) {
  return await prisma.sequence.findUnique({
    where: { id },
    include: { steps: true },
  });
}

async function updateSequence(id, name) {
  return await prisma.sequence.update({
    where: { id },
    data: { name },
  });
}

async function deleteSequence(id) {
  return await prisma.sequence.delete({
    where: { id },
  });
}

module.exports = {
  createSequence,
  getSequenceById,
  updateSequence,
  deleteSequence,
};
