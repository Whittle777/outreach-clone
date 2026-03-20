class ConfidenceScoreRouting {
  constructor(config) {
    this.highThreshold = config.confidenceScoreRouting.high;
    this.moderateThreshold = config.confidenceScoreRouting.moderate;
    this.slackIntegration = config.slackIntegration;
  }

  route(confidenceScore, task) {
    if (confidenceScore > this.highThreshold) {
      this.slackIntegration.sendNotification(`High confidence task: ${task}`);
      return 'high';
    } else if (confidenceScore > this.moderateThreshold) {
      this.slackIntegration.sendNotification(`Moderate confidence task: ${task}`);
      return 'moderate';
    } else {
      this.slackIntegration.sendNotification(`Low confidence task: ${task}`);
      return 'low';
    }
  }
}

module.exports = ConfidenceScoreRouting;
