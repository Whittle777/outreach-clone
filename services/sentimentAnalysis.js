const axios = require('axios');
const SentimentAnalysisModel = require('../models/SentimentAnalysis');

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

  async storeSentimentAnalysis(prospectId, sentimentScore, sentimentLabel, metadata, country, region) {
    try {
      await SentimentAnalysisModel.create({
        prospectId,
        sentimentScore,
        sentimentLabel,
        metadata,
        country,
        region,
      });
    } catch (error) {
      throw new Error(`Error storing sentiment analysis: ${error.message}`);
    }
  }
}

module.exports = SentimentAnalysis;
