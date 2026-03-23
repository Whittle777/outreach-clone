// path/to/predictionService.js

const axios = require('axios');
const DnsManager = require('../services/dnsManager');
const config = require('../config');

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
}

module.exports = PredictionService;
