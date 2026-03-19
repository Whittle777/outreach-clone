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

  async createCall(targetPhoneNumber) {
    const payload = {
      targetParticipants: [
        {
          phoneNumber: targetPhoneNumber
        }
      ]
    };

    try {
      const response = await axios.post(`${this.baseURL}/calls`, payload, { headers: this.headers });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create call: ${error.message}`);
    }
  }
}

module.exports = AzureAcs;
