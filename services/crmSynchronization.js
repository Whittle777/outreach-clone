const axios = require('axios');
const config = require('../config').getConfig();

class CrmSynchronizationService {
  constructor() {
    this.enabled = config.crmSyncEnabled;
    this.url = config.crmSyncUrl;
    this.apiKey = config.crmSyncApiKey;
  }

  async syncData(data) {
    if (!this.enabled) {
      console.log('CRM synchronization is disabled.');
      return;
    }

    try {
      const response = await axios.post(this.url, data, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Data synchronized successfully:', response.data);
    } catch (error) {
      console.error('Error synchronizing data with CRM:', error.message);
    }
  }
}

module.exports = new CrmSynchronizationService();
