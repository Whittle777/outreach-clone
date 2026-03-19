const SentimentAnalysis = require('../models/SentimentAnalysis');

async function storeSentimentAnalysis(prospectId, sentimentScore, sentimentLabel, metadata) {
  return await SentimentAnalysis.create(prospectId, sentimentScore, sentimentLabel, metadata);
}

async function getSentimentAnalysisByProspectId(prospectId) {
  return await SentimentAnalysis.findByProspectId(prospectId);
}

module.exports = {
  storeSentimentAnalysis,
  getSentimentAnalysisByProspectId,
};
