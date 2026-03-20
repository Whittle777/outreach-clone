const axios = require('axios');

class SlackNotifier {
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
      console.error('Failed to send Slack notification:', error.message);
    }
  }
}

module.exports = SlackNotifier;
