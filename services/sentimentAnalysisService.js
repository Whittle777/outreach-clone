const axios = require('axios');

class SentimentAnalysisService {
  constructor() {
    this.apiUrl = 'https://api.sentimentanalysis.com/analyze'; // Hypothetical API endpoint
  }

  async analyze(transcriptionId) {
    try {
      const response = await axios.post(this.apiUrl, {
        transcriptionId,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to analyze sentiment: ${error.message}`);
    }
  }
}

module.exports = SentimentAnalysisService;
