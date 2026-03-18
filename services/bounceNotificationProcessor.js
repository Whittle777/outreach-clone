const { updateProspectStatus } = require('../models/Prospect');
const { acquireLock, releaseLock } = require('../services/stateMachine');
const { createAbuseComplaint } = require('../models/AbuseComplaint');
const { getShard } = require('../services/getShard'); // Assuming getShard is in a separate file
const redis = require('redis');
const { consumer } = require('../config/kafka');

const redisClient = redis.createClient();

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
      const shard = getShard(bento);
      const retryKey = `retry:${prospectId}:${bento}`;
      const retryCount = await redisClient.get(retryKey);

      if (retryCount && parseInt(retryCount) >= 3) {
        await updateProspectStatus(prospectId, bento, 'HardBounced');
        await createAbuseComplaint(prospectId, bento);
      } else {
        const delay = retryCount ? Math.pow(2, parseInt(retryCount)) * 1000 : 1000; // Exponential backoff
        await redisClient.setex(retryKey, delay / 1000, (retryCount ? parseInt(retryCount) + 1 : 1));
        console.log(`Soft bounce detected for prospectId: ${prospectId}. Retrying after ${delay}ms.`);
        // Introduce a delay before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        // Re-enqueue the message for retry
        await reenqueueMessageForRetry(notification);
      }
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

async function reenqueueMessageForRetry(notification) {
  const producer = require('../config/kafka').producer();
  await producer.connect();
  await producer.send({
    topic: 'email-dispatch-requests',
    messages: [{
      value: JSON.stringify(notification),
    }],
  });
  await producer.disconnect();
}

async function startBounceNotificationConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'bounce-notifications', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const notification = JSON.parse(message.value.toString());
        await processBounceNotification(notification);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    },
  });
}

module.exports = {
  processBounceNotification,
  startBounceNotificationConsumer,
};
