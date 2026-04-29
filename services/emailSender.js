const nodemailer = require('nodemailer');
const logger = require('../services/logger');
const config = require("../config/index").getConfig();
const TrackingPixelEvents = require('../services/trackingPixelEvents');
const AbuseComplaints = require('../services/abuseComplaints');
const BounceHandler = require('../services/bounceHandler');
const RetryStrategy = require('../services/retryStrategy');

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
    this.trackingPixelEvents = new TrackingPixelEvents();
    this.abuseComplaints = new AbuseComplaints();
    this.bounceHandler = new BounceHandler();
    this.retryStrategy = new RetryStrategy();
  }

  async sendEmail(emailOptions) {
    try {
      const info = await this.transporter.sendMail(emailOptions);
      logger.log('Email sent successfully', { info });
      await this.trackEmailSent(emailOptions, info);
      return info;
    } catch (error) {
      if (this.bounceHandler.isBounceError(error)) {
        const bounceInfo = this.bounceHandler.getBounceInfo(error);
        await this.handleBounce(emailOptions, bounceInfo);
        if (this.retryStrategy.shouldRetry(bounceInfo)) {
          await this.retryStrategy.retryEmail(emailOptions, bounceInfo);
        } else {
          logger.error('Max retry attempts reached for bounce', { error });
          throw error;
        }
      } else {
        logger.error('Email sending failed', { error });
        throw error;
      }
    }
  }

  async trackEmailSent(emailOptions, info) {
    try {
      const trackingPixelEvent = {
        prospectId: emailOptions.prospectId,
        sequenceStepId: emailOptions.sequenceStepId,
        emailId: info.messageId,
        eventType: 'sent',
        timestamp: new Date(),
      };
      await this.trackingPixelEvents.write(trackingPixelEvent);
      logger.log('Email sent tracking event recorded', trackingPixelEvent);
    } catch (error) {
      logger.error('Failed to record email sent tracking event', { error });
    }
  }

  async handleBounce(emailOptions, bounceInfo) {
    try {
      const bounceEvent = {
        prospectId: emailOptions.prospectId,
        sequenceStepId: emailOptions.sequenceStepId,
        emailId: bounceInfo.messageId,
        bounceType: bounceInfo.bounceType,
        timestamp: new Date(),
      };
      await this.trackingPixelEvents.write(bounceEvent);
      logger.log('Bounce event recorded', bounceEvent);
    } catch (error) {
      logger.error('Failed to record bounce event', { error });
    }
  }

  async handleUnsubscribe(emailOptions, unsubscribeInfo) {
    try {
      const unsubscribeEvent = {
        prospectId: emailOptions.prospectId,
        sequenceStepId: emailOptions.sequenceStepId,
        emailId: unsubscribeInfo.messageId,
        timestamp: new Date(),
      };
      await this.abuseComplaints.write(unsubscribeEvent);
      logger.log('Unsubscribe event recorded', unsubscribeEvent);
    } catch (error) {
      logger.error('Failed to record unsubscribe event', { error });
    }
  }
}

module.exports = EmailSender;
