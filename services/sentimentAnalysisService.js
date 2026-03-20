const axios = require('axios');
const DoubleWriteStrategy = require('../services/doubleWriteStrategy');

class SentimentAnalysisService {
  constructor() {
    this.apiUrl = 'https://api.sentimentanalysis.com/analyze'; // Hypothetical API endpoint
    this.doubleWriteStrategy = new DoubleWriteStrategy();
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

      const sentimentData = {
        transcriptionId,
        sentimentScore: response.data.sentimentScore,
        sentimentLabel: response.data.sentimentLabel,
        metadata: response.data.metadata,
        country: response.data.country,
      };

      await this.doubleWriteStrategy.createSentimentAnalysis(sentimentData);

      return response.data;
    } catch (error) {
      throw new Error(`Failed to analyze sentiment: ${error.message}`);
    }
  }
}

module.exports = SentimentAnalysisService;
