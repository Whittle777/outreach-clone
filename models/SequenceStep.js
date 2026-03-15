const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSequenceStep(sequenceId, order, delayDays, subject, body, bento) {
  return await prisma.sequenceStep.create({
    data: {
      sequenceId,
      order,
      delayDays,
      subject,
      body,
      bento,
    },
  });
}

async function getSequenceStepsBySequenceId(sequenceId) {
  return await prisma.sequenceStep.findMany({
    where: { sequenceId },
  });
}

async function updateSequenceStep(id, order, delayDays, subject, body, bento) {
  return await prisma.sequenceStep.update({
    where: { id },
    data: { order, delayDays, subject, body, bento },
  });
}

async function deleteSequenceStep(id) {
  return await prisma.sequenceStep.delete({
    where: { id },
  });
}

module.exports = {
  createSequenceStep,
  getSequenceStepsBySequenceId,
  updateSequenceStep,
  deleteSequenceStep,
};
