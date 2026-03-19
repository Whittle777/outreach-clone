const kafka = require('../config/kafka');
const { handleProspectStatusChange } = require('../services/eventHandlers');
const Broadway = require('broadway');
const { validateEmailBatch, validateWebhookPayload, validateSPFRecord, validateDMARCPolicy } = require('./validation');
const { checkRateLimit, resetRateLimit, handleRateLimitError, checkReputation } = require('./rateLimiting');
const { getShard } = require('./getShard'); // Assuming getShard is in a separate file
const { google } = require('googleapis');
const axios = require('axios');
const redis = require('redis');
const nodemailer = require('nodemailer');
const smtpConfig = require('../config/smtpConfig');
const { createAbuseComplaint } = require('../models/AbuseComplaint');
const { processBounceNotification } = require('../services/bounceNotificationProcessor');
const { logTrackingPixelEvent, wrapLink } = require('../services/trackingPixelLogger'); // New import
const { analyzeOpenRates } = require('../services/openRateAnalyzer'); // New import
const ngoe = require('./ngoe'); // New import
const { generateEmailContent } = require('./gpt4'); // New import
const { analyzeSentiment } = require('./gemini'); // New import
const azureServiceBusProducer = require('./azureServiceBusProducer'); // New import

const producer = kafka.producer();
const consumer = kafka.consumer();
const redisClient = redis.createClient();
const transporter = nodemailer.createTransport(smtpConfig);

async function run() {
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: 'email-dispatch-requests', fromBeginning: true });
  await redisClient.connect();

  const pipeline = Broadway.pipeline({
    stages: [
      Broadway.stage('parseMessage', async (message) => {
        return JSON.parse(message.value.toString());
      }),
      Broadway.stage('batchMessages', async (messages) => {
        const batch = [];
        for (const message of messages) {
          batch.push(message);
        }
        return batch;
      }),
      Broadway.stage('validateEmailBatch', async (batch) => {
        const validationResults = await validateEmailBatch(batch);
        const validMessages = batch.filter((message, index) => validationResults[index]);
        if (validMessages.length !== batch.length) {
          throw new Error('Some messages in the batch are invalid');
        }
        return validMessages;
      }),
      Broadway.stage('checkSPFRecord', async (messages) => {
        for (const message of messages) {
          const { email } = message;
          const domain = email.split('@')[1];
          const spfValid = await validateSPFRecord(domain);
          if (!spfValid) {
            throw new Error('SPF record validation failed');
          }
        }
        return messages;
      }),
      Broadway.stage('checkRateLimit', async (messages) => {
        for (const message of messages) {
          const { prospectId, bento } = message;
          if (!(await checkRateLimit(prospectId, bento))) {
            throw new Error('Rate limit exceeded');
          }
        }
        return messages;
      }),
      Broadway.stage('checkReputation', async (messages) => {
        for (const message of messages) {
          const { bento } = message;
          await checkReputation(bento);
        }
        return messages;
      }),
      Broadway.stage('acquireLock', async (messages) => {
        for (const message of messages) {
          const { prospectId, bento } = message;
          const lockKey = `lock:${prospectId}:${bento}`;
          const lockAcquired = await acquireLock(lockKey);
          if (!lockAcquired) {
            throw new Error('Failed to acquire lock');
          }
        }
        return messages;
      }),
      Broadway.stage('handleStatusChange', async (messages) => {
        for (const message of messages) {
          const { prospectId, bento, newStatus } = message;
          await handleProspectStatusChange(prospectId, bento, newStatus);
          console.log(`Email dispatch request processed for prospectId: ${prospectId}`);
          // Introduce a delay to simulate processing time
          await new Promise(resolve => setTimeout(resolve, 1000)); // Delay for 1 second
        }
        return messages;
      }),
      Broadway.stage('updateDMARCPolicy', async (messages) => {
        for (const message of messages) {
          const { prospectId, bento, dmarcPolicy } = message;
          if (await validateDMARCPolicy(dmarcPolicy)) {
            await updateProspectDMARCPolicy(prospectId, bento, dmarcPolicy);
          } else {
            throw new Error('Invalid DMARC policy');
          }
        }
        return messages;
      }),
      Broadway.stage('logTrackingPixelEvent', async (messages) => {
        for (const message of messages) {
          const { prospectId, bento, trackingPixelData } = message;
          await logTrackingPixelEvent(prospectId, bento, trackingPixelData);
        }
        return messages;
      }),
      Broadway.stage('wrapLinks', async (messages) => {
        for (const message of messages) {
          const { emailContent, trackingPixelData } = message;
          const wrappedEmailContent = wrapLinksInEmail(emailContent, trackingPixelData);
          message.emailContent = wrappedEmailContent;
        }
        return messages;
      }),
      Broadway.stage('generateEmailContent', async (messages) => {
        for (const message of messages) {
          const { prospectId, bento, subject, emailContent } = message;
          const prompt = `Generate an email with subject "${subject}" and content "${emailContent}" for prospect ${prospectId} in bento ${bento}.`;
          const generatedContent = await generateEmailContent(prompt);
          message.emailContent = generatedContent;
        }
        return messages;
      }),
      Broadway.stage('analyzeSentiment', async (messages) => {
        for (const message of messages) {
          const { emailContent } = message;
          const sentiment = await analyzeSentiment(emailContent);
          message.sentiment = sentiment;
        }
        return messages;
      }),
      Broadway.stage('sendEmail', async (messages) => {
        for (const message of messages) {
          const { email, subject, emailContent } = message;
          const mailOptions = {
            from: smtpConfig.auth.user,
            to: email,
            subject: subject,
            html: emailContent,
          };
          await transporter.sendMail(mailOptions);
          console.log(`Email sent to ${email}`);
        }
        return messages;
      }),
      Broadway.stage('releaseLock', async (messages) => {
        for (const message of messages) {
          const { prospectId, bento } = message;
          const lockKey = `lock:${prospectId}:${bento}`;
          await releaseLock(lockKey);
        }
        return messages;
      }),
      Broadway.stage('produceDispatchedMessage', async (messages) => {
        await producer.send({
          topic: 'email-dispatched',
          messages: messages.map(message => ({
            value: JSON.stringify(message),
          })),
        });
      }),
      Broadway.stage('enqueueNGOE', async (messages) => {
        for (const message of messages) {
          await producer.send({
            topic: 'ngoe-tasks',
            messages: [{
              value: JSON.stringify({ type: 'sendEmail', payload: message }),
            }],
          });
        }
      }),
      Broadway.stage('sendToAzureServiceBus', async (messages) => {
        for (const message of messages) {
          await azureServiceBusProducer.sendMessage(message);
        }
      }),
    ],
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        await pipeline.run([message]);
      } catch (error) {
        if (error.message === 'Rate limit exceeded') {
          const { prospectId, bento } = JSON.parse(message.value.toString());
          await handleRateLimitError(prospectId, bento);
          // Introduce backpressure by adding a delay
          await new Promise(resolve => setTimeout(resolve, 1000)); // Delay for 1 second
        } else if (error.message === 'Failed to acquire lock') {
          console.error('Failed to acquire lock for message:', message);
          // Introduce backpressure by adding a delay
          await new Promise(resolve => setTimeout(resolve, 1000)); // Delay for 1 second
        } else if (error.message === 'SPF record validation failed') {
          console.error('SPF record validation failed for message:', message);
          // Introduce backpressure by adding a delay
          await new Promise(resolve => setTimeout(resolve, 1000)); // Delay for 1 second
        } else if (error.message === 'Invalid DMARC policy') {
          console.error('Invalid DMARC policy for message:', message);
          // Introduce backpressure by adding a delay
          await new Promise(resolve => setTimeout(resolve, 1000)); // Delay for 1 second
        } else if (error.message === 'Abuse complaint detected') {
          const { prospectId, bento } = JSON.parse(message.value.toString());
          await createAbuseComplaint(prospectId, bento);
          console.error('Abuse complaint detected for message:', message);
          // Introduce backpressure by adding a delay
          await new Promise(resolve => setTimeout(resolve, 1000)); // Delay for 1 second
        }
        console.error('Error processing email dispatch request:', error);
      }
    },
  });
}

async function simulateHighLoad(numMessages) {
  const messages = [];
  for (let i = 0; i < numMessages; i++) {
    messages.push({
      prospectId: `prospect-${i}`,
      bento: i % 3,
      newStatus: 'Dispatched',
      email: `prospect-${i}@example.com`,
      subject: 'Test Email',
      emailContent: 'SGVsbG8gV29ybGQh', // Base64 encoded "Hello World!"
      provider: 'google', // or 'microsoft'
      accessToken: 'your_access_token_here',
      refreshToken: 'your_refresh_token_here',
      dmarcPolicy: 'reject', // Example DMARC policy
      trackingPixelData: 'tracking_pixel_data_here', // Example tracking pixel data
    });
  }

  for (const message of messages) {
    await producer.send({
      topic: 'email-dispatch-requests',
      messages: [{
        value: JSON.stringify(message),
      }],
    });
  }
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

async function updateProspectDMARCPolicy(prospectId, bento, dmarcPolicy) {
  const shard = getShard(bento);
  return await prisma[shard].prospect.update({
    where: { id: prospectId },
    data: { dmarcPolicy },
  });
}

function wrapLinksInEmail(emailContent, trackingPixelData) {
  // Simple regex to find and wrap links
  const linkRegex = /(https?:\/\/[^\s]+)/g;
  return emailContent.replace(linkRegex, (url) => wrapLink(url, trackingPixelData));
}

module.exports = { run, simulateHighLoad };
