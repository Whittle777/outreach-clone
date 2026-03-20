const axios = require('axios');

class SlackIntegrationService {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
  }

  async sendNotification(message) {
    try {
      await axios.post(this.webhookUrl, {
        text: message,
      });
      console.log('Slack notification sent successfully');
    } catch (error) {
      console.error('Failed to send Slack notification', error);
    }
  }
}

module.exports = SlackIntegrationService;
