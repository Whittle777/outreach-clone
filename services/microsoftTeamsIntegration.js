const axios = require('axios');

class MicrosoftTeamsIntegration {
  constructor(config) {
    this.webhookUrl = config.microsoftTeams.webhookUrl;
    this.bento = config.bento;
  }

  async sendNotification(message) {
    try {
      const response = await axios.post(this.webhookUrl, {
        text: `${this.bento}: ${message}`
      });
      console.log('Microsoft Teams notification sent successfully:', response.data);
    } catch (error) {
      console.error('Failed to send Microsoft Teams notification:', error);
    }
  }

  async sendInteractiveNotification(channel, message, actions) {
    try {
      const response = await axios.post(this.webhookUrl, {
        channel: channel,
        text: `${this.bento}: ${message}`,
        attachments: [{
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            type: 'AdaptiveCard',
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            version: '1.0',
            body: [
              {
                type: 'TextBlock',
                text: `${this.bento}: ${message}`,
                wrap: true
              }
            ],
            actions: actions
          }
        }]
      });
      console.log('Microsoft Teams interactive notification sent successfully:', response.data);
    } catch (error) {
      console.error('Failed to send Microsoft Teams interactive notification:', error);
    }
  }
}

module.exports = MicrosoftTeamsIntegration;
