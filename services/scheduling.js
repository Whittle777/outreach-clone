// Mock implementation of scheduling service for the MVP
async function scheduleSequence(sequenceId, bento) {
  console.log(`[Mock] Scheduled sequence ${sequenceId} for ${bento}`);
  return new Date();
}

async function acquireLock(lockKey) {
  return true;
}

async function releaseLock(lockKey) {
  // no-op
}

module.exports = {
  scheduleSequence,
  acquireLock,
  releaseLock,
};
