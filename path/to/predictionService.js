// path/to/predictionService.js

const axios = require('axios');
const DnsManager = require('../services/dnsManager');
const config = require('../config');
const logger = require('../services/logger');

class PredictionService {
  constructor(apiKey, bento) {
    this.apiKey = apiKey;
    this.bento = bento;
    this.apiUrl = 'https://api.example.com/predict'; // Replace with actual API URL
    this.dnsManager = new DnsManager(config.getConfig().dnsApiKey, bento);
  }

  async predict(quarterData) {
    try {
      const response = await axios.post(this.apiUrl, { ...quarterData, bento: this.bento }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Prediction service error:', error);
      throw new Error('Failed to get prediction');
    }
  }

  async updateSpfRecord(domain, spfRecord) {
    try {
      const response = await this.dnsManager.updateSpfRecord(domain, spfRecord);
      return response;
    } catch (error) {
      console.error('SPF record update error:', error);
      throw new Error('Failed to update SPF record');
    }
  }

  async retrySoftBounce(domain, spfRecord, maxRetries = 5, retryDelay = 1000) {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const response = await this.dnsManager.updateSpfRecord(domain, spfRecord);
        logger.info('SPF record updated successfully', { domain, spfRecord });
        return response;
      } catch (error) {
        retries++;
        if (retries < maxRetries) {
          logger.warn('SPF record update failed, retrying...', { domain, spfRecord, retries });
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          logger.error('SPF record update failed after max retries', { domain, spfRecord, retries });
          throw new Error('Failed to update SPF record after max retries');
        }
      }
    }
  }
}

module.exports = PredictionService;
