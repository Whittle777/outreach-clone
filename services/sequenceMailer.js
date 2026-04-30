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
      where: { provider: 'google' },
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

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const unsubscribeUrl = `${appUrl}/prospects/list-unsubscribe?email=${encodeURIComponent(prospect.email)}`;

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to: prospect.email,
    subject,
    html: `${body.replace(/\n/g, '<br/>')}<img src="${trackingUrl}" width="1" height="1" style="display:none" />`,
    text: body,
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });

  // Nodemailer returns a Message-ID (e.g. <abc123@domain>) — store it for reply matching
  const externalMessageId = info.messageId || null;

  return recordStepSent(enrollment, step, externalMessageId);
}

// SMTP error codes / messages that indicate a permanent (hard) bounce.
// These should pause the enrollment rather than retry.
const HARD_BOUNCE_SIGNALS = [
  /\b55[0-4]\b/,              // SMTP 550–554 permanent failure
  /user (unknown|not found)/i,
  /no such user/i,
  /invalid (recipient|address)/i,
  /address.*does not exist/i,
  /mailbox.*unavailable/i,
  /recipient.*rejected/i,
];

function isHardBounce(errMessage) {
  return HARD_BOUNCE_SIGNALS.some(p => p.test(errMessage));
}

/**
 * Run all due enrollment steps. Called by cron or triggered manually.
 * Returns a summary of what was sent.
 *
 * Safety guardrails:
 *   - MAX_EMAILS_PER_DAY  (env, default 200) — daily cap across all sequences
 *   - EMAIL_SEND_DELAY_MS (env, default 2000) — pause between each send to avoid SMTP throttling
 *   - Hard bounces pause the enrollment immediately
 *   - 3+ failures on one enrollment in 7 days → paused
 */
async function runDueSequenceEmails() {
  const MAX_PER_DAY    = parseInt(process.env.MAX_EMAILS_PER_DAY   || '200');
  const SEND_DELAY_MS  = parseInt(process.env.EMAIL_SEND_DELAY_MS  || '2000');

  // Count emails already sent today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const sentToday = await prisma.emailActivity.count({
    where: { status: 'sent', sentAt: { gte: todayStart } },
  });

  if (sentToday >= MAX_PER_DAY) {
    console.log(`[Sequence Mailer] Daily cap reached (${sentToday}/${MAX_PER_DAY}). Skipping run.`);
    return { sent: 0, failed: 0, errors: [], limitReached: true };
  }

  const remaining = MAX_PER_DAY - sentToday;
  const dueEnrollments = await getDueEnrollments();
  const results = { sent: 0, failed: 0, errors: [] };

  for (const enrollment of dueEnrollments) {
    if (results.sent >= remaining) {
      console.log(`[Sequence Mailer] Reached daily cap mid-run. Stopping.`);
      break;
    }

    // Pause enrollment if it has accumulated 3+ failures in the last 7 days
    const recentFailures = await prisma.emailActivity.count({
      where: {
        enrollmentId: enrollment.id,
        status: 'failed',
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });
    if (recentFailures >= 3) {
      await prisma.sequenceEnrollment.update({
        where: { id: enrollment.id },
        data: { status: 'paused', pausedAt: new Date(), pausedReason: 'max_failures', nextStepDue: null },
      });
      console.warn(`[Sequence Mailer] Paused enrollment ${enrollment.id} — ${recentFailures} failures in 7 days`);
      continue;
    }

    const steps = enrollment.sequence.steps;
    const nextStep = steps.find((s) =>
      enrollment.currentStepOrder === 0 ? s.order === 1 : s.order > enrollment.currentStepOrder
    );
    if (!nextStep) continue;

    try {
      await sendStepEmail(enrollment, nextStep);
      results.sent++;
      // Throttle: wait between sends to avoid SMTP rate limiting
      if (results.sent < remaining) {
        await new Promise(r => setTimeout(r, SEND_DELAY_MS));
      }
    } catch (err) {
      results.failed++;
      results.errors.push({ prospectId: enrollment.prospectId, error: err.message });
      console.error(`[Sequence Mailer] Failed step ${nextStep.order} for prospect ${enrollment.prospectId}:`, err.message);

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

      // Hard bounce: pause enrollment immediately, flag prospect
      if (isHardBounce(err.message)) {
        await prisma.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: { status: 'paused', pausedAt: new Date(), pausedReason: 'hard_bounce', nextStepDue: null },
        });
        await prisma.prospect.update({
          where: { id: enrollment.prospectId },
          data: { status: 'Bounced' },
        });
        console.warn(`[Sequence Mailer] Hard bounce for prospect ${enrollment.prospectId} — enrollment paused`);
      }
    }
  }

  return results;
}

module.exports = { sendStepEmail, runDueSequenceEmails, interpolate };
