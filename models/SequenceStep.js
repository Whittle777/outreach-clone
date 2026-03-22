const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSequenceStep(sequenceId, order, delayDays, subject, body, bento, schemaTag = "default", scheduledTime = null, state = "pending", timeShift = 0) {
  const shard = getShard(bento);
  const calculatedScheduledTime = calculateScheduledTime(delayDays, timeShift);
  return await prisma[shard].sequenceStep.create({
    data: {
      sequenceId,
      order,
      delayDays,
      subject,
      body,
      bento,
      schemaTag,
      scheduledTime: scheduledTime || calculatedScheduledTime,
      state,
    },
  });
}

async function getSequenceStepsBySequenceId(sequenceId, bento) {
  const shard = getShard(bento);
  return await prisma[shard].sequenceStep.findMany({
    where: { sequenceId },
  });
}

async function updateSequenceStep(id, order, delayDays, subject, body, bento, schemaTag = "default", scheduledTime = null, state = null) {
  const shard = getShard(bento);
  const data = {
    order,
    delayDays,
    subject,
    body,
    bento,
    schemaTag,
    scheduledTime,
  };

  if (state !== null) {
    data.state = state;
  }

  return await prisma[shard].sequenceStep.update({
    where: { id },
    data,
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

function calculateScheduledTime(delayDays, timeShift) {
  const now = new Date();
  now.setDate(now.getDate() + delayDays + timeShift);
  return now.toISOString();
}

module.exports = {
  createSequenceStep,
  getSequenceStepsBySequenceId,
  updateSequenceStep,
  deleteSequenceStep,
};
