const nodemailer = require('nodemailer');
const smtpConfig = require('../config/smtpConfig');
const config = require('../config');
const rateLimiter = require('../services/rateLimiter');
const Email = require('../models/email'); // Assuming the email model is in models/email.js

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport(smtpConfig);

async function sendScheduledEmails() {
  // Example: Send an email to a list of prospects
  const prospects = [
    { email: 'prospect1@example.com', name: 'Prospect 1' },
    { email: 'prospect2@example.com', name: 'Prospect 2' },
  ];

  const emailOptions = {
    from: smtpConfig.auth.user,
    subject: 'Scheduled Email',
    text: 'This is a scheduled email from our system.',
  };

  for (const prospect of prospects) {
    emailOptions.to = prospect.email;
    emailOptions.html = `<p>Hello ${prospect.name},</p><p>This is a scheduled email from our system.</p>`;

    let retryCount = 0;
    let success = false;

    while (!success && retryCount < config.emailService.retryLimit) {
      try {
        await transporter.sendMail(emailOptions);
        console.log(`Email sent to ${prospect.email}`);
        success = true;
        // Update the email status to 'sent' in the database
        await Email.update(prospect.email, { status: 'sent' });
      } catch (error) {
        if (error.response && error.response.status === 421) { // Soft bounce
          retryCount++;
          const backoffTime = config.emailService.backoffInterval * Math.pow(2, retryCount - 1);
          console.log(`Soft bounce detected for ${prospect.email}. Retrying in ${backoffTime} ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        } else {
          console.error(`Error sending email to ${prospect.email}:`, error);
          // Update the email status to 'bounced' in the database
          await Email.update(prospect.email, { status: 'bounced' });
          break;
        }
      }
    }

    if (!success) {
      console.error(`Failed to send email to ${prospect.email} after ${retryCount} retries.`);
      // Update the email status to 'bounced' in the database
      await Email.update(prospect.email, { status: 'bounced' });
    }
  }
}

module.exports = {
  sendScheduledEmails,
};
