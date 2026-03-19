// services/slackApp.js

const axios = require('axios');
const config = require('../config/settings');
const realTimeReasoningLogs = require('../services/realTimeReasoningLogs');

class SlackApp {
  constructor() {
    this.webhookUrl = config.slack.webhookUrl;
  }

  async sendMessage(message) {
    try {
      const response = await axios.post(this.webhookUrl, {
        text: message,
      });
      realTimeReasoningLogs.addLog('sendMessage', `Message sent to Slack: ${message}`);
      return response.data;
    } catch (error) {
      console.error('Error sending message to Slack:', error);
      realTimeReasoningLogs.addLog('sendMessage', `Error sending message to Slack: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new SlackApp();
