const { updateProspectStatus } = require('../models/Prospect');
const { acquireLock, releaseLock } = require('../services/stateMachine');
const { createAbuseComplaint } = require('../models/AbuseComplaint');

async function processBounceNotification(notification) {
  const { prospectId, bento, bounceType } = notification;

  const lockKey = `lock:${prospectId}:${bento}`;
  const lockAcquired = await acquireLock(lockKey);

  if (!lockAcquired) {
    console.error('Failed to acquire lock for bounce notification:', notification);
    return;
  }

  try {
    if (bounceType === 'soft') {
      await updateProspectStatus(prospectId, bento, 'SoftBounced');
    } else if (bounceType === 'hard') {
      await updateProspectStatus(prospectId, bento, 'HardBounced');
      await createAbuseComplaint(prospectId, bento);
    } else {
      console.error('Unknown bounce type:', bounceType);
    }
  } catch (error) {
    console.error('Error processing bounce notification:', error);
  } finally {
    await releaseLock(lockKey);
  }
}

module.exports = { processBounceNotification };
