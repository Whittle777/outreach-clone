const axios = require('axios');
const { voiceCallLimiter } = require('./rateLimiter');

class VoiceAgentIntegration {
  constructor(apiKey, apiUrl) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  async createCall(prospectId, phoneNumber, script, country) {
    try {
      const key = `call:${phoneNumber}`;
      if (await voiceCallLimiter.isRateLimited(key)) {
        throw new Error('Rate limit exceeded');
      }

      const response = await axios.post(`${this.apiUrl}/calls`, {
        prospectId,
        phoneNumber,
        script,
        country,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      await voiceCallLimiter.incrementRequestCount(key);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create call: ${error.message}`);
    }
  }
}

module.exports = VoiceAgentIntegration;
