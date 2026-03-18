const nodemailer = require('nodemailer');
const smtpConfig = require('../config/smtpConfig');

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

    try {
      await transporter.sendMail(emailOptions);
      console.log(`Email sent to ${prospect.email}`);
    } catch (error) {
      console.error(`Error sending email to ${prospect.email}:`, error);
    }
  }
}

module.exports = {
  sendScheduledEmails,
};
