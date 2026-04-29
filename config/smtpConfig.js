/**
 * SMTP Configuration
 *
 * For Gmail testing (recommended):
 *   1. Enable 2FA: myaccount.google.com/security
 *   2. Create App Password: myaccount.google.com/apppasswords → "Mail"
 *   3. Set in .env:
 *        SMTP_HOST=smtp.gmail.com
 *        SMTP_PORT=587
 *        SMTP_SECURE=false
 *        SMTP_USER=you@gmail.com
 *        SMTP_PASS=xxxx xxxx xxxx xxxx
 *        EMAIL_FROM_NAME=Henry from Outreach.ai
 *
 * For Google Workspace: same as above, just use your workspace email.
 * For production: swap to SendGrid/Postmark — set SMTP_HOST, PORT, USER, PASS accordingly.
 */
module.exports = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};
