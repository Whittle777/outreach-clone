const axios = require('axios');
const config = require('../services/config').getConfig();

class SlackIntegration {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
  }

  async sendNotification(message) {
    if (!this.webhookUrl) {
      console.error('Slack webhook URL is not configured');
      return;
    }

    try {
      await axios.post(this.webhookUrl, {
        text: message,
      });
      console.log('Slack notification sent successfully');
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  async sendAudioFileStorageNotification(audioFile) {
    const message = `New audio file stored: ${audioFile.name} (${audioFile.type}) - URL: ${audioFile.url}`;
    await this.sendNotification(message);
  }

  async sendInteractiveNotification(channel, message, actions) {
    if (!this.webhookUrl) {
      console.error('Slack webhook URL is not configured');
      return;
    }

    try {
      await axios.post(this.webhookUrl, {
        channel: channel,
        text: message,
        attachments: [
          {
            text: "Please review and approve the following:",
            actions: actions
          }
        ]
      });
      console.log('Slack interactive notification sent successfully');
    } catch (error) {
      console.error('Failed to send Slack interactive notification:', error);
    }
  }
}

module.exports = new SlackIntegration();
