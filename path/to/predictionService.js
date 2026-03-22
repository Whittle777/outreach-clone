// predictionService.js

const axios = require('axios');

class PredictionService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://api.example.com/predict'; // Replace with actual API URL
  }

  async predict(quarterData) {
    try {
      const response = await axios.post(this.apiUrl, quarterData, {
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
}

module.exports = PredictionService;
