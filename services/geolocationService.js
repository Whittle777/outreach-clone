const axios = require('axios');

class GeolocationService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://api.ipgeolocation.io/ipgeo';
  }

  async getCountryByIp(ipAddress) {
    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          apiKey: this.apiKey,
          ip: ipAddress,
        },
      });
      return response.data.country_name;
    } catch (error) {
      throw new Error(`Error fetching geolocation data: ${error.message}`);
    }
  }
}

module.exports = GeolocationService;
