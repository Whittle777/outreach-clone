// services/microsoftTeamsApp.js

const axios = require('axios');
const jwt = require('jsonwebtoken');
const config = require('../config/settings');
const realTimeReasoningLogs = require('../services/realTimeReasoningLogs');

class MicrosoftTeamsApp {
  constructor() {
    this.webhookUrl = config.microsoftTeams.webhookUrl;
    this.botToken = process.env.MICROSOFT_TEAMS_BOT_TOKEN || 'your-bot-token'; // Use environment variable for bot token
  }

  async sendMessage(message) {
    try {
      const response = await axios.post(this.webhookUrl, {
        text: message,
      });
      realTimeReasoningLogs.addLog('sendMessage', `Message sent to Microsoft Teams: ${message}`);
      return response.data;
    } catch (error) {
      console.error('Error sending message to Microsoft Teams:', error);
      realTimeReasoningLogs.addLog('sendMessage', `Error sending message to Microsoft Teams: ${error.message}`);
      throw error;
    }
  }

  async handleIncomingMessage(message) {
    // Placeholder for handling incoming messages from Microsoft Teams
    // This should be replaced with actual logic to process incoming messages
    realTimeReasoningLogs.addLog('handleIncomingMessage', `Received message from Microsoft Teams: ${message}`);
    console.log('Received message from Microsoft Teams:', message);
  }
}

module.exports = new MicrosoftTeamsApp();
