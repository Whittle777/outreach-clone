const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function scheduleSequence(sequenceId, bento) {
  const shard = getShard(bento);
  const sequence = await prisma[shard].sequence.findUnique({
    where: { id: sequenceId },
  });

  if (!sequence) {
    throw new Error('Sequence not found');
  }

  // Implement scheduling logic here
  // For now, let's just update the nextRun field
  const nextRun = calculateNextRun(sequence.interval, sequence.nextRun);
  await prisma[shard].sequence.update({
    where: { id: sequenceId },
    data: { nextRun },
  });

  return nextRun;
}

function calculateNextRun(interval, lastRun) {
  // Simple interval-based scheduling logic
  // For example, if interval is 'daily', add 1 day to lastRun
  // This is a placeholder implementation
  return new Date(lastRun.getTime() + intervalToMilliseconds(interval));
}

function intervalToMilliseconds(interval) {
  // Convert interval to milliseconds
  // For example, 'daily' -> 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
  const intervals = {
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000,
  };

  return intervals[interval] || 0;
}

function getShard(bento) {
  // Simple sharding logic based on bento value
  // For example, you can use a hash function or a modulo operation
  return `shard_${bento % 3}`;
}

module.exports = {
  scheduleSequence,
};
