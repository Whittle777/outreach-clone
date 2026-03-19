const sentimentAnalysisService = require('../services/sentimentAnalysisService');

exports.getSentimentAnalysis = async (req, res) => {
  try {
    const { text } = req.body;
    const result = await sentimentAnalysisService.analyzeText(text);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
