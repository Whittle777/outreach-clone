const axios = require('axios');
const DoubleWriteStrategy = require('../services/doubleWriteStrategy');
const SentimentAnalysis = require('../models/SentimentAnalysis');

class SentimentAnalysisService {
  constructor(apiKey) {
    this.apiUrl = 'https://api.sentimentanalysis.com/analyze'; // Hypothetical API endpoint
    this.doubleWriteStrategy = new DoubleWriteStrategy();
    this.apiKey = apiKey;
  }

  async analyze(transcriptionId) {
    try {
      const response = await axios.post(this.apiUrl, {
        transcriptionId,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
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
      await SentimentAnalysis.create(sentimentData);

      return response.data;
    } catch (error) {
      throw new Error(`Failed to analyze sentiment: ${error.message}`);
    }
  }

  async findSentimentAnalysis(transcriptionId) {
    try {
      return await SentimentAnalysis.findUnique({ where: { transcriptionId } });
    } catch (error) {
      throw new Error(`Failed to retrieve sentiment analysis: ${error.message}`);
    }
  }
}

module.exports = SentimentAnalysisService;
