const axios = require('axios');

class SentimentAnalysis {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://api.sentimentanalysis.io/analyze';
  }

  async analyze(transcript) {
    try {
      const response = await axios.post(this.apiUrl, {
        text: transcript,
        apiKey: this.apiKey,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Error analyzing sentiment: ${error.message}`);
    }
  }
}

module.exports = SentimentAnalysis;
