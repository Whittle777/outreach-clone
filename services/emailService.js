const nodemailer = require('nodemailer');
const smtpConfig = require('../config/smtpConfig');
const config = require('../config');
const rateLimiter = require('../services/rateLimiter');
const Email = require('../models/email'); // Assuming the email model is in models/email.js
const EmailActivities = require('../models/emailActivities'); // Assuming the emailActivities model is in models/emailActivities.js
const Prospect = require('../models/Prospect'); // Assuming the Prospect model is in models/Prospect.js
const BounceEvent = require('../models/bounceEvent'); // Added for bounce event tracking
const UnsubscribeEvent = require('../models/unsubscribeEvent'); // Added for unsubscribe event tracking
const AIGenerator = require('../services/aiGenerator'); // Added for AI-generated email content
const logger = require('../services/logger'); // Added for logging
const dkim = require('nodemailer-dkim');

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport(smtpConfig);

const aiGenerator = new AIGenerator();

// Configure DKIM
const dkimOptions = {
  domainName: smtpConfig.auth.user.split('@')[1],
  keySelector: config.getConfig().dkimSelector,
  privateKey: config.getConfig().dkimPrivateKey
};

transporter.use('stream/transform', dkim.sign(dkimOptions));

async function sendScheduledEmails() {
  // Example: Send an email to a list of prospects
  const prospects = await Prospect.findAll();

  for (const prospect of prospects) {
    const emailContent = await aiGenerator.generateEmailContent(prospect);
    const emailOptions = {
      from: smtpConfig.auth.user,
      to: prospect.email,
      subject: 'Follow-up from Your Company',
      html: wrapLinks(emailContent, prospect.email),
    };

    let retryCount = 0;
    let success = false;

    while (!success && retryCount < config.emailService.retryLimit) {
      try {
        // Check rate limit before sending the email
        if (await rateLimiter.emailLimiter.isRateLimited(prospect.email)) {
          console.log(`Rate limit exceeded for ${prospect.email}. Retrying in ${config.emailService.backoffInterval} ms...`);
          await new Promise(resolve => setTimeout(resolve, config.emailService.backoffInterval));
          continue;
        }

        await transporter.sendMail(emailOptions);
        console.log(`Email sent to ${prospect.email}`);
        success = true;
        // Update the email status to 'sent' in the database
        await Email.update(prospect.email, { status: 'sent' });
        logger.emailSent(`Email sent to ${prospect.email}`, { emailOptions });
      } catch (error) {
        if (error.response && error.response.status === 421) { // Soft bounce
          retryCount++;
          const backoffTime = config.emailService.backoffInterval * Math.pow(2, retryCount - 1);
          console.log(`Soft bounce detected for ${prospect.email}. Retrying in ${backoffTime} ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          logger.emailRetry(`Soft bounce detected for ${prospect.email}. Retrying in ${backoffTime} ms...`, { emailOptions, retryCount });
        } else if (error.response && error.response.status === 550) { // Hard bounce
          console.log(`Hard bounce detected for ${prospect.email}.`);
          await handleHardBounce(prospect.email, prospect.bento);
          break;
        } else {
          console.error(`Error sending email to ${prospect.email}:`, error);
          // Update the email status to 'bounced' in the database
          await Email.update(prospect.email, { status: 'bounced' });
          logger.emailFailed(`Error sending email to ${prospect.email}`, { error, emailOptions });
          break;
        }
      }
    }

    if (!success) {
      console.error(`Failed to send email to ${prospect.email} after ${retryCount} retries.`);
      // Update the email status to 'bounced' in the database
      await Email.update(prospect.email, { status: 'bounced' });
      logger.emailFailed(`Failed to send email to ${prospect.email} after ${retryCount} retries.`, { emailOptions, retryCount });
    }
  }
}

async function retrySoftBouncedEmails() {
  const softBouncedEmails = await Email.getSoftBouncedEmails();

  for (const email of softBouncedEmails) {
    let retryCount = 0;
    let success = false;

    while (!success && retryCount < config.emailService.retryLimit) {
      try {
        // Check rate limit before sending the email
        if (await rateLimiter.emailLimiter.isRateLimited(email.to)) {
          console.log(`Rate limit exceeded for ${email.to}. Retrying in ${config.emailService.backoffInterval} ms...`);
          await new Promise(resolve => setTimeout(resolve, config.emailService.backoffInterval));
          continue;
        }

        await transporter.sendMail(email);
        console.log(`Email retried and sent to ${email.to}`);
        success = true;
        // Update the email status to 'sent' in the database
        await Email.update(email.to, { status: 'sent' });
        logger.emailSent(`Email retried and sent to ${email.to}`, { email });
      } catch (error) {
        if (error.response && error.response.status === 421) { // Soft bounce
          retryCount++;
          const backoffTime = config.emailService.backoffInterval * Math.pow(2, retryCount - 1);
          console.log(`Soft bounce detected for ${email.to}. Retrying in ${backoffTime} ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          logger.emailRetry(`Soft bounce detected for ${email.to}. Retrying in ${backoffTime} ms...`, { email, retryCount });
        } else if (error.response && error.response.status === 550) { // Hard bounce
          console.log(`Hard bounce detected for ${email.to}.`);
          await handleHardBounce(email.to, email.bento);
          break;
        } else {
          console.error(`Error retrying email to ${email.to}:`, error);
          // Update the email status to 'bounced' in the database
          await Email.update(email.to, { status: 'bounced' });
          logger.emailFailed(`Error retrying email to ${email.to}`, { error, email });
          break;
        }
      }
    }

    if (!success) {
      console.error(`Failed to retry email to ${email.to} after ${retryCount} retries.`);
      // Update the email status to 'bounced' in the database
      await Email.update(email.to, { status: 'bounced' });
      logger.emailFailed(`Failed to retry email to ${email.to} after ${retryCount} retries.`, { email, retryCount });
    }
  }
}

async function handleHardBounce(email, bento) {
  // Update the email status to 'bounced' in the database
  await Email.update(email, { status: 'bounced' });
  // Mark the prospect as failed
  await Prospect.markProspectAsFailed(email, bento);
  // Create a bounce event
  await BounceEvent.create({ email, bento, timestamp: new Date() });
  logger.emailFailed(`Hard bounce detected for ${email}`, { email, bento });
}

async function sendEmail(emailData) {
  const emailOptions = {
    from: smtpConfig.auth.user,
    to: emailData.to,
    subject: emailData.subject,
    html: wrapLinks(emailData.html, emailData.to),
  };

  let retryCount = 0;
  let success = false;

  while (!success && retryCount < config.emailService.retryLimit) {
    try {
      // Check rate limit before sending the email
      if (await rateLimiter.emailLimiter.isRateLimited(emailData.to)) {
        console.log(`Rate limit exceeded for ${emailData.to}. Retrying in ${config.emailService.backoffInterval} ms...`);
        await new Promise(resolve => setTimeout(resolve, config.emailService.backoffInterval));
        continue;
      }

      await transporter.sendMail(emailOptions);
      console.log(`Email sent to ${emailData.to}`);
      success = true;
      // Update the email status to 'sent' in the database
      await Email.update(emailData.to, { status: 'sent' });
      logger.emailSent(`Email sent to ${emailData.to}`, { emailOptions });
    } catch (error) {
      if (error.response && error.response.status === 421) { // Soft bounce
        retryCount++;
        const backoffTime = config.emailService.backoffInterval * Math.pow(2, retryCount - 1);
        console.log(`Soft bounce detected for ${emailData.to}. Retrying in ${backoffTime} ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        logger.emailRetry(`Soft bounce detected for ${emailData.to}. Retrying in ${backoffTime} ms...`, { emailOptions, retryCount });
      } else if (error.response && error.response.status === 550) { // Hard bounce
        console.log(`Hard bounce detected for ${emailData.to}.`);
        await handleHardBounce(emailData.to, emailData.bento);
        break;
      } else {
        console.error(`Error sending email to ${emailData.to}:`, error);
        // Update the email status to 'bounced' in the database
        await Email.update(emailData.to, { status: 'bounced' });
        logger.emailFailed(`Error sending email to ${emailData.to}`, { error, emailOptions });
        break;
      }
    }
  }

  if (!success) {
    console.error(`Failed to send email to ${emailData.to} after ${retryCount} retries.`);
    // Update the email status to 'bounced' in the database
    await Email.update(emailData.to, { status: 'bounced' });
    logger.emailFailed(`Failed to send email to ${emailData.to} after ${retryCount} retries.`, { emailOptions, retryCount });
  }
}

function wrapLinks(html, email) {
  const linkPattern = /<a href="([^"]+)">/g;
  return html.replace(linkPattern, (match, url) => {
    const wrappedUrl = `${config.getConfig().linkTrackingUrl}?url=${encodeURIComponent(url)}&email=${encodeURIComponent(email)}`;
    return `<a href="${wrappedUrl}">`;
  });
}

module.exports = {
  sendScheduledEmails,
  retrySoftBouncedEmails,
  sendEmail,
};
