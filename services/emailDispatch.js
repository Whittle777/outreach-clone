const kafka = require('../config/kafka');
const { handleProspectStatusChange } = require('../services/eventHandlers');
const Broadway = require('broadway');
const { validateEmailBatch, validateWebhookPayload } = require('./validation');
const { checkRateLimit, resetRateLimit, handleRateLimitError } = require('./rateLimiting');
const { getShard } = require('./getShard'); // Assuming getShard is in a separate file
const { google } = require('googleapis');
const axios = require('axios');

const producer = kafka.producer();
const consumer = kafka.consumer();

async function run() {
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: 'email-dispatch-requests', fromBeginning: true });

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
      Broadway.stage('checkRateLimit', async (messages) => {
        for (const message of messages) {
          const { prospectId, bento } = message;
          if (!(await checkRateLimit(prospectId, bento))) {
            throw new Error('Rate limit exceeded');
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
      Broadway.stage('produceDispatchedMessage', async (messages) => {
        await producer.send({
          topic: 'email-dispatched',
          messages: messages.map(message => ({
            value: JSON.stringify(message),
          })),
        });
      }),
      Broadway.stage('sendEmail', async (messages) => {
        for (const message of messages) {
          const { prospectId, bento, emailContent, provider } = message;
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
              access_token: message.accessToken,
              refresh_token: message.refreshToken,
            });

            const encodedMessage = Buffer.from(emailContent).toString('base64');
            const email = {
              Message: {
                Raw: encodedMessage,
              },
            };

            await axios.post('https://graph.microsoft.com/v1.0/me/sendMail', email, {
              headers: {
                Authorization: `Bearer ${message.accessToken}`,
                'Content-Type': 'application/json',
              },
            });

            console.log(`Email sent to prospectId: ${prospectId} via Microsoft`);
          }
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
      emailContent: 'SGVsbG8gV29ybGQh', // Base64 encoded "Hello World!"
      provider: 'google', // or 'microsoft'
      accessToken: 'your_access_token_here',
      refreshToken: 'your_refresh_token_here',
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

module.exports = { run, simulateHighLoad };
