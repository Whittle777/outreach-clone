const axios = require('axios');

class MicrosoftTeamsIntegration {
  constructor(config) {
    this.webhookUrl = config.microsoftTeams.webhookUrl;
  }

  async sendNotification(message) {
    try {
      const response = await axios.post(this.webhookUrl, {
        text: message
      });
      console.log('Microsoft Teams notification sent successfully:', response.data);
    } catch (error) {
      console.error('Failed to send Microsoft Teams notification:', error);
    }
  }
}

module.exports = MicrosoftTeamsIntegration;
