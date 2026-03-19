// services/sentimentAnalysis.js

const { SentimentAnalyzer, PorterStemmer } = require('natural');

class SentimentAnalysis {
  constructor() {
    this.analyzer = new SentimentAnalyzer('English', PorterStemmer, 'afinn');
  }

  analyze(text) {
    return this.analyzer.getSentiment(text);
  }
}

module.exports = new SentimentAnalysis();
