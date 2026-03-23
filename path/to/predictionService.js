// predictionService.js

const axios = require('axios');

class PredictionService {
  constructor(apiKey, bento) {
    this.apiKey = apiKey;
    this.bento = bento;
    this.apiUrl = 'https://api.example.com/predict'; // Replace with actual API URL
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
}

module.exports = PredictionService;
