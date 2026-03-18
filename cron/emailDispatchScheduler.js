const cron = require('node-cron');
const { run } = require('../services/emailDispatch');

// Schedule the email dispatch process to run every hour
cron.schedule('0 * * * *', () => {
  console.log('Running email dispatch process...');
  run();
});

console.log('Email dispatch scheduler started');
