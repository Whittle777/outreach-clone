class ConfidenceScoreRoutingService {
  constructor() {
    this.highConfidenceThreshold = 85;
    this.moderateConfidenceThreshold = 70;
  }

  routeMessage(confidenceScore) {
    if (confidenceScore > this.highConfidenceThreshold) {
      return 'high';
    } else if (confidenceScore >= this.moderateConfidenceThreshold) {
      return 'moderate';
    } else {
      return 'low';
    }
  }
}

module.exports = ConfidenceScoreRoutingService;
