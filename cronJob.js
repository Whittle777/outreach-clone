const cron = require('node-cron');
const emailService = require('./services/emailService');

// Schedule a cron job to run every hour
cron.schedule('0 * * * *', async () => {
  try {
    await emailService.sendScheduledEmails();
    console.log('Scheduled emails sent successfully');
  } catch (error) {
    console.error('Error sending scheduled emails:', error);
  }
});
