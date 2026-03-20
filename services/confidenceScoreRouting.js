class ConfidenceScoreRouting {
  constructor(config) {
    this.highThreshold = config.confidenceScoreRouting.high;
    this.moderateThreshold = config.confidenceScoreRouting.moderate;
  }

  route(confidenceScore) {
    if (confidenceScore > this.highThreshold) {
      return 'high';
    } else if (confidenceScore > this.moderateThreshold) {
      return 'moderate';
    } else {
      return 'low';
    }
  }
}

module.exports = ConfidenceScoreRouting;
