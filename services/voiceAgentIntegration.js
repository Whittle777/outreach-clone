const axios = require('axios');

class VoiceAgentIntegration {
  constructor(apiKey, apiUrl) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  async createCall(prospectId, phoneNumber, script) {
    try {
      const response = await axios.post(`${this.apiUrl}/calls`, {
        prospectId,
        phoneNumber,
        script,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create call: ${error.message}`);
    }
  }
}

module.exports = VoiceAgentIntegration;
