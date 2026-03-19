// messageBroker/slack.js

const axios = require('axios');
const mcp = require('../services/mcp');
const naturalLanguageGuardrails = require('../services/naturalLanguageGuardrails');

class Slack {
  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || 'your-slack-webhook-url'; // Use environment variable for webhook URL
  }

  async sendNotification(message) {
    try {
      // Enforce policy directives
      naturalLanguageGuardrails.enforcePolicyDirectives(message);

      // Encrypt and sign the message
      const encryptedMessage = mcp.encrypt(message);
      const signature = mcp.sign(encryptedMessage);

      // Prepare the payload
      const payload = {
        text: encryptedMessage,
        attachments: [
          {
            text: `Signature: ${signature}`,
          },
        ],
      };

      // Send the message to Slack
      await axios.post(this.webhookUrl, payload);

      console.log('Notification sent to Slack successfully');
    } catch (error) {
      console.error('Error sending notification to Slack:', error);
    }
  }
}

module.exports = new Slack();
