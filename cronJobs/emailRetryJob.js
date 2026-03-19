const cron = require('node-cron');
const emailService = require('../services/emailService');

// Schedule the job to run every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running email retry job...');
  await emailService.retrySoftBouncedEmails();
});
