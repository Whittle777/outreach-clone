const axios = require('axios');

class RateLimiterService {
  constructor(url) {
    this.url = url;
  }

  async checkRateLimit(prospectId) {
    try {
      const response = await axios.get(`${this.url}/${prospectId}`);
      return response.data.allowed;
    } catch (error) {
      throw new Error(`Rate limit check failed: ${error.message}`);
    }
  }
}

module.exports = RateLimiterService;
