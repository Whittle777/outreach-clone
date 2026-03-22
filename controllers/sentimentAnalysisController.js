const SentimentAnalysisService = require('../services/sentimentAnalysisService');

const sentimentAnalysisService = new SentimentAnalysisService();

exports.getSentimentAnalysis = async (req, res) => {
  try {
    const transcriptionId = req.body.transcriptionId;
    const sentimentData = await sentimentAnalysisService.analyze(transcriptionId);
    res.status(200).json(sentimentData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSentimentAnalysisResults = async (req, res) => {
  try {
    const transcriptionId = req.params.transcriptionId;
    const sentimentData = await sentimentAnalysisService.findSentimentAnalysis(transcriptionId);
    if (sentimentData) {
      res.status(200).json(sentimentData);
    } else {
      res.status(404).json({ error: 'Sentiment analysis not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
