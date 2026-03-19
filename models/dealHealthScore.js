class DealHealthScore {
  constructor(prospectId, score, status, metadata) {
    this.prospectId = prospectId;
    this.score = score;
    this.status = status;
    this.metadata = metadata;
  }

  static async create(prospectId, metadata) {
    // Calculate the deal health score based on metadata
    const score = this.calculateScore(metadata);
    const status = this.determineStatus(score);

    // Check GDPR compliance
    if (!isGDPRCompliant(metadata)) {
      throw new Error('Data not compliant with GDPR');
    }

    return new DealHealthScore(prospectId, score, status, metadata);
  }

  static calculateScore(metadata) {
    // Example calculation: sum of scores for different criteria
    let score = 0;
    if (metadata.recentInteraction) {
      score += 20;
    }
    if (metadata.openRate) {
      score += 30;
    }
    if (metadata.clickRate) {
      score += 25;
    }
    if (metadata.replyRate) {
      score += 25;
    }
    return score;
  }

  static determineStatus(score) {
    if (score >= 80) {
      return 'High';
    } else if (score >= 50) {
      return 'Medium';
    } else {
      return 'Low';
    }
  }
}

module.exports = DealHealthScore;
