// services/sentimentAnalysis.js

const { SentimentAnalyzer, PorterStemmer } = require('natural');

class SentimentAnalysis {
  constructor(apiKey) {
    this.analyzer = new SentimentAnalyzer('English', PorterStemmer, 'afinn');
    this.apiKey = apiKey;
  }

  analyze(text) {
    return this.analyzer.getSentiment(text);
  }
}

module.exports = SentimentAnalysis;
