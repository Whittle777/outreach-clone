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

  async detectHardBounce(prospectId, phoneNumber) {
    try {
      const response = await axios.get(`${this.apiUrl}/bounce-detection`, {
        params: {
          prospectId,
          phoneNumber,
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data.isHardBounce;
    } catch (error) {
      throw new Error(`Failed to detect hard bounce: ${error.message}`);
    }
  }

  async handleFailedState(prospectId, callId) {
    try {
      const response = await axios.post(`${this.apiUrl}/calls/${callId}/fail`, {
        prospectId,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to handle failed state: ${error.message}`);
    }
  }

  async startTranscription(callId) {
    try {
      const response = await axios.post(`${this.apiUrl}/calls/${callId}/transcription/start`, {
        callId,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to start transcription: ${error.message}`);
    }
  }

  async detectResistanceOrRegulatoryEdgeCases(callId) {
    try {
      const response = await axios.get(`${this.apiUrl}/calls/${callId}/resistance-detection`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data.isResistanceOrRegulatoryEdgeCase;
    } catch (error) {
      throw new Error(`Failed to detect resistance or regulatory edge cases: ${error.message}`);
    }
  }
}

module.exports = VoiceAgentIntegration;
