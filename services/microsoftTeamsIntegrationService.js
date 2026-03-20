const axios = require('axios');
const logger = require('../services/logger');

class MicrosoftTeamsIntegrationService {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
  }

  async sendNotification(message) {
    try {
      const response = await axios.post(this.webhookUrl, {
        text: message,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      logger.log('Microsoft Teams Notification Sent', { message });
    } catch (error) {
      logger.error('Error sending Microsoft Teams notification', { message, error: error.message });
    }
  }
}

module.exports = MicrosoftTeamsIntegrationService;
