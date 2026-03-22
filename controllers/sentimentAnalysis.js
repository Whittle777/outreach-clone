const SentimentAnalysisService = require('../services/sentimentAnalysisService');

const sentimentAnalysisService = new SentimentAnalysisService(process.env.SENTIMENT_ANALYSIS_API_KEY);

exports.getSentimentAnalysis = async (req, res) => {
  try {
    const transcriptionId = req.body.transcriptionId;
    const result = await sentimentAnalysisService.analyze(transcriptionId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSentimentAnalysisResults = async (req, res) => {
  try {
    const transcriptionId = req.params.transcriptionId;
    const result = await sentimentAnalysisService.findSentimentAnalysis(transcriptionId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllSentimentAnalysisResults = async (req, res) => {
  try {
    const results = await sentimentAnalysisService.findAllSentimentAnalysis();
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
