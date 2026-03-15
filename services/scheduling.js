const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const stateMachine = require('./stateMachine');
const kafka = require('../config/kafka');
const redis = require('redis');

const producer = kafka.producer();
const redisClient = redis.createClient();

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

  // Schedule sequence steps
  await scheduleSequenceSteps(sequenceId, bento);

  // Produce a message to the 'sequence-scheduled' topic
  await producer.send({
    topic: 'sequence-scheduled',
    messages: [
      {
        value: JSON.stringify({ sequenceId, bento, nextRun }),
      },
    ],
  });

  return nextRun;
}

async function scheduleSequenceSteps(sequenceId, bento) {
  const shard = getShard(bento);
  const sequenceSteps = await prisma[shard].sequenceStep.findMany({
    where: { sequenceId },
    orderBy: { order: 'asc' },
  });

  for (const step of sequenceSteps) {
    const scheduledTime = calculateScheduledTime(step.delayDays, sequence.nextRun);
    await prisma[shard].sequenceStep.update({
      where: { id: step.id },
      data: { scheduledTime },
    });
  }
}

function calculateNextRun(interval, lastRun) {
  // Simple interval-based scheduling logic
  // For example, if interval is 'daily', add 1 day to lastRun
  // This is a placeholder implementation
  return new Date(lastRun.getTime() + intervalToMilliseconds(interval));
}

function calculateScheduledTime(delayDays, nextRun) {
  // Calculate scheduled time based on delay days
  return new Date(nextRun.getTime() + delayDays * 24 * 60 * 60 * 1000);
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

async function acquireLock(lockKey) {
  const lockAcquired = await redisClient.set(lockKey, 'locked', {
    NX: true, // Only set if the key does not exist
    EX: 10,   // Expire the lock after 10 seconds
  });
  return lockAcquired === 'OK';
}

async function releaseLock(lockKey) {
  await redisClient.del(lockKey);
}

module.exports = {
  scheduleSequence,
  acquireLock,
  releaseLock,
};
