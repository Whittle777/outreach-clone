const WebSocket = require('ws');

class VoiceAgentDashboard {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.ws = new WebSocket(`${this.apiUrl}/dashboard`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    this.ws.on('open', () => {
      console.log('Connected to voice agent dashboard');
    });

    this.ws.on('message', (message) => {
      console.log('Received dashboard update:', JSON.parse(message));
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    this.ws.on('close', () => {
      console.log('Disconnected from voice agent dashboard');
    });
  }

  async fetchDashboardData() {
    try {
      const response = await axios.get(`${this.apiUrl}/dashboard/data`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch dashboard data: ${error.message}`);
    }
  }
}

module.exports = VoiceAgentDashboard;
