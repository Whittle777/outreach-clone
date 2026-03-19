const axios = require('axios');

class AzureAcs {
  constructor(config) {
    this.config = config;
    this.baseURL = `https://api.communication.azure.com/communication/callautomation/${this.config.connectionString}`;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.accessToken}`
    };
  }

  async createCall(targetPhoneNumber, country, onBehalfOf) {
    const payload = {
      targetParticipants: [
        {
          phoneNumber: targetPhoneNumber
        }
      ]
    };

    // Geographic routing logic
    if (country === 'US') {
      payload.region = 'us-central';
    } else if (country === 'EU') {
      payload.region = 'eu-central';
    } else {
      payload.region = 'global';
    }

    // onBehalfOf parameter handling
    if (onBehalfOf) {
      payload.onBehalfOf = onBehalfOf;
    }

    try {
      const response = await axios.post(`${this.baseURL}/calls`, payload, { headers: this.headers });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create call: ${error.message}`);
    }
  }

  async startTranscription(callId) {
    const payload = {
      operation: 'startTranscription'
    };

    try {
      const response = await axios.post(`${this.baseURL}/calls/${callId}/operations`, payload, { headers: this.headers });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to start transcription: ${error.message}`);
    }
  }

  async getTranscriptionResult(transcriptionId) {
    try {
      const response = await axios.get(`${this.baseURL}/transcriptions/${transcriptionId}`, { headers: this.headers });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get transcription result: ${error.message}`);
    }
  }
}

module.exports = AzureAcs;
