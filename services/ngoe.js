const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { acquireLock, releaseLock } = require('./stateMachine');
const { handleProspectStatusChange } = require('./eventHandlers');
const { logTrackingPixelEvent, wrapLink } = require('./trackingPixelLogger');
const { analyzeOpenRates } = require('./openRateAnalyzer');
const { validateEmailBatch, validateWebhookPayload, validateSPFRecord, validateDMARCPolicy } = require('./validation');
const { checkRateLimit, resetRateLimit, handleRateLimitError, checkReputation } = require('./rateLimiting');
const { getShard } = require('./getShard');
const { google } = require('googleapis');
const axios = require('axios');
const redis = require('redis');
const { createAbuseComplaint } = require('../models/AbuseComplaint');
const { processBounceNotification } = require('../services/bounceNotificationProcessor');

const producer = require('../config/kafka').producer();
const consumer = require('../config/kafka').consumer();
const redisClient = redis.createClient();

async function run() {
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: 'ngoe-tasks', fromBeginning: true });
  await redisClient.connect();

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const task = JSON.parse(message.value.toString());
        await executeTask(task);
      } catch (error) {
        console.error('Error processing NGOE task:', error);
      }
    },
  });
}

async function executeTask(task) {
  const { type, payload } = task;

  switch (type) {
    case 'sendEmail':
      await sendEmail(payload);
      break;
    case 'updateDMARCPolicy':
      await updateDMARCPolicy(payload);
      break;
    case 'logTrackingPixelEvent':
      await logTrackingPixelEvent(payload);
      break;
    case 'wrapLinks':
      await wrapLinks(payload);
      break;
    case 'analyzeOpenRates':
      await analyzeOpenRates(payload);
      break;
    default:
      console.error('Unknown task type:', type);
  }
}

async function sendEmail(payload) {
  const { prospectId, bento, emailContent, provider } = payload;

  if (provider === 'google') {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
    });
    const accessToken = await auth.getClient().getAccessToken();
    const gmail = google.gmail({ version: 'v1', auth });

    const encodedMessage = Buffer.from(emailContent).toString('base64');
    const email = {
      raw: encodedMessage,
    };

    await gmail.users.messages.send({
      userId: 'me',
      resource: email,
    });

    console.log(`Email sent to prospectId: ${prospectId} via Google`);
  } else if (provider === 'microsoft') {
    const auth = new google.auth.OAuth2({
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      redirectUri: process.env.MICROSOFT_REDIRECT_URI,
    });

    auth.setCredentials({
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken,
    });

    const encodedMessage = Buffer.from(emailContent).toString('base64');
    const email = {
      Message: {
        Raw: encodedMessage,
      },
    };

    await axios.post('https://graph.microsoft.com/v1.0/me/sendMail', email, {
      headers: {
        Authorization: `Bearer ${payload.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Email sent to prospectId: ${prospectId} via Microsoft`);
  }
}

async function updateDMARCPolicy(payload) {
  const { prospectId, bento, dmarcPolicy } = payload;
  if (await validateDMARCPolicy(dmarcPolicy)) {
    await updateProspectDMARCPolicy(prospectId, bento, dmarcPolicy);
  } else {
    throw new Error('Invalid DMARC policy');
  }
}

async function logTrackingPixelEvent(payload) {
  const { prospectId, bento, trackingPixelData } = payload;
  await logTrackingPixelEvent(prospectId, bento, trackingPixelData);
}

async function wrapLinks(payload) {
  const { emailContent, trackingPixelData } = payload;
  const wrappedEmailContent = wrapLinksInEmail(emailContent, trackingPixelData);
  console.log(`Wrapped email content for prospectId: ${payload.prospectId}`);
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

module.exports = { run };
