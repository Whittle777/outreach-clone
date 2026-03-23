// services/dnsManager.js

class DnsManager {
  constructor(apiKey, bento) {
    this.apiKey = apiKey;
    this.bento = bento;
    this.apiUrl = 'https://api.example.com/dns'; // Replace with actual API URL
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
}

module.exports = DnsManager;
