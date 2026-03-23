const axios = require('axios');

class DnsManager {
  constructor(apiKey, bento) {
    this.apiKey = apiKey;
    this.bento = bento;
    this.apiUrl = process.env.DNS_API_URL || 'https://api.example.com/dns'; // Default DNS API URL
  }

  async updateSpfRecord(domain, spfRecord) {
    try {
      const response = await axios.post(this.apiUrl, { domain, spfRecord, bento: this.bento }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('DNS Manager error:', error);
      throw new Error('Failed to update SPF record');
    }
  }

  async updateDkimRecord(domain, selector, publicKey) {
    try {
      const response = await axios.post(this.apiUrl, { domain, selector, publicKey, bento: this.bento }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('DNS Manager error:', error);
      throw new Error('Failed to update DKIM record');
    }
  }

  async updateDmarcRecord(domain, dmarcPolicy) {
    try {
      const response = await axios.post(this.apiUrl, { domain, dmarcPolicy, bento: this.bento }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('DNS Manager error:', error);
      throw new Error('Failed to update DMARC record');
    }
  }
}

module.exports = DnsManager;
