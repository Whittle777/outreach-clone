const axios = require('axios');

class MLModelService {
  constructor(modelUrl) {
    this.modelUrl = modelUrl;
  }

  async generatePrediction(data) {
    try {
      const response = await axios.post(this.modelUrl, data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate prediction: ${error.message}`);
    }
  }
}

module.exports = MLModelService;
