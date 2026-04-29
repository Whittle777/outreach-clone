/**
 * sequenceMailer.js
 *
 * Lightweight email sender for sequence steps.
 * Uses SMTP (Gmail App Password or any SMTP provider) — no Kafka/SQS required.
 *
 * Gmail setup (one-time):
 *   1. Enable 2FA on your Google account
 *   2. Go to myaccount.google.com/apppasswords
 *   3. Generate an App Password for "Mail"
 *   4. Set in .env:
 *        SMTP_HOST=smtp.gmail.com
 *        SMTP_PORT=587
 *        SMTP_SECURE=false
 *        SMTP_USER=you@gmail.com
 *        SMTP_PASS=xxxx xxxx xxxx xxxx   (16-char app password)
 *        EMAIL_FROM_NAME="Henry from Outreach.ai"
 */

const nodemailer = require('nodemailer');
const { getDueEnrollments, recordStepSent } = require('./enrollmentService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Build SMTP transport. Priority:
 *   1. SMTP_USER env var (set in .env directly)
 *   2. 'google' integration credential stored in DB (via Integrations UI)
 * Throws a clear error if neither is configured.
 */
async function createTransport() {
  let user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS;
  let host = process.env.SMTP_HOST || 'smtp.gmail.com';
  let port = parseInt(process.env.SMTP_PORT || '587');

  if (!user) {
    // Try reading from integrations DB (Google App Password flow)
    const cred = await prisma.integrationCredential.findFirst({
      where: { provider: 'google', userId: 1 },
    });
    if (cred?.clientId && cred?.clientSecret) {
      user = cred.clientId;   // email address
      pass = cred.clientSecret; // app password
    }
  }

  if (!user || !pass) {
    throw new Error(
      'No email credentials configured. Set SMTP_USER/SMTP_PASS in .env or connect Google Workspace in Integrations.'
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });
}

/**
 * Interpolate {{firstName}}, {{lastName}}, {{company}}, {{email}} tokens in subject/body.
 */
function interpolate(template, prospect) {
  return template
    .replace(/\{\{firstName\}\}/gi, prospect.firstName || '')
    .replace(/\{\{lastName\}\}/gi, prospect.lastName || '')
    .replace(/\{\{company\}\}/gi, prospect.companyName || '')
    .replace(/\{\{email\}\}/gi, prospect.email || '')
    .replace(/\{\{title\}\}/gi, prospect.title || '');
}

/**
 * Send one sequence step email to one prospect.
 * Returns the EmailActivity record created.
 */
async function sendStepEmail(enrollment, step) {
  const { prospect } = enrollment;
  const subject = interpolate(step.subject, prospect);
  const body = interpolate(step.body, prospect);

  const transporter = await createTransport();
  const smtpUser = transporter.options?.auth?.user || process.env.SMTP_USER || '';
  const fromName = process.env.EMAIL_FROM_NAME || smtpUser;
  const fromAddress = smtpUser;

  // Inline tracking pixel — 1x1 transparent GIF
  const trackingUrl = `${process.env.APP_URL || 'http://localhost:3000'}/track/open?prospectId=${prospect.id}&stepId=${step.id}`;

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to: prospect.email,
    subject,
    html: `${body.replace(/\n/g, '<br/>')}<img src="${trackingUrl}" width="1" height="1" style="display:none" />`,
    text: body,
  });

  // Nodemailer returns a Message-ID (e.g. <abc123@domain>) — store it for reply matching
  const externalMessageId = info.messageId || null;

  return recordStepSent(enrollment, step, externalMessageId);
}

/**
 * Run all due enrollment steps. Called by cron or triggered manually.
 * Returns a summary of what was sent.
 */
async function runDueSequenceEmails() {
  const dueEnrollments = await getDueEnrollments();
  const results = { sent: 0, failed: 0, errors: [] };

  for (const enrollment of dueEnrollments) {
    const steps = enrollment.sequence.steps;
    // Find the next step to send (first step with order > currentStepOrder, or step 1 if currentStepOrder is 0)
    const nextStep = steps.find((s) =>
      enrollment.currentStepOrder === 0 ? s.order === 1 : s.order > enrollment.currentStepOrder
    );

    if (!nextStep) continue;

    try {
      await sendStepEmail(enrollment, nextStep);
      results.sent++;
    } catch (err) {
      results.failed++;
      results.errors.push({ prospectId: enrollment.prospectId, error: err.message });
      console.error(`Failed to send step ${nextStep.order} to prospect ${enrollment.prospectId}:`, err.message);
      // Record the failure so it's visible in the Emails tab
      try {
        await prisma.emailActivity.create({
          data: {
            prospectId: enrollment.prospectId,
            sequenceStepId: nextStep.id,
            enrollmentId: enrollment.id,
            status: 'failed',
            subject: nextStep.subject,
            failureReason: err.message,
          },
        });
      } catch (_) { /* non-critical */ }
    }
  }

  return results;
}

module.exports = { sendStepEmail, runDueSequenceEmails, interpolate };
