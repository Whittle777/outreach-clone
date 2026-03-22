const axios = require('axios');
const config = require('../config').getConfig();

class MicrosoftService {
  async sendRequest(endpoint, data) {
    try {
      const response = await axios.post(
        `${config.microsoftBackendUrl}/${endpoint}`,
        data,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': config.microsoftBackendApiKey,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error sending request to Microsoft backend:', error);
      throw error;
    }
  }
}

module.exports = new MicrosoftService();
