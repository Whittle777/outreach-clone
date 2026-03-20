const nodemailer = require('nodemailer');
const logger = require('../services/logger');
const config = require('../services/config').getConfig();

class EmailSender {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.auth.user,
        pass: config.email.auth.pass,
      },
    });
  }

  async sendEmail(emailOptions) {
    try {
      const info = await this.transporter.sendMail(emailOptions);
      logger.log('Email sent successfully', { info });
      return info;
    } catch (error) {
      if (this.isSoftBounceError(error)) {
        await this.handleSoftBounce(emailOptions, error);
      } else {
        logger.error('Email sending failed', { error });
        throw error;
      }
    }
  }

  isSoftBounceError(error) {
    // Check if the error is a soft bounce
    // This is a placeholder, you should implement the actual logic to detect soft bounces
    return error.response && error.response.includes('soft bounce');
  }

  async handleSoftBounce(emailOptions, error) {
    const retryCount = emailOptions.retryCount || 0;
    const maxRetries = config.email.maxRetries || 3;
    const backoffTime = config.email.backoffTime || 1000; // 1 second

    if (retryCount >= maxRetries) {
      logger.error('Max retry attempts reached for soft bounce', { error });
      throw error;
    }

    logger.warn('Soft bounce detected, retrying...', { retryCount, maxRetries, backoffTime });

    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          emailOptions.retryCount = retryCount + 1;
          const info = await this.sendEmail(emailOptions);
          resolve(info);
        } catch (retryError) {
          reject(retryError);
        }
      }, backoffTime);
    });
  }
}

module.exports = EmailSender;
