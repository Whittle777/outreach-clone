class DealHealthScore {
  constructor(prospectId, score, status, metadata) {
    this.prospectId = prospectId;
    this.score = score;
    this.status = status;
    this.metadata = metadata;
  }

  static async create(prospectId, score, status, metadata) {
    // Check GDPR compliance
    if (!isGDPRCompliant(metadata)) {
      throw new Error('Data not compliant with GDPR');
    }

    return new DealHealthScore(prospectId, score, status, metadata);
  }
}

module.exports = DealHealthScore;
