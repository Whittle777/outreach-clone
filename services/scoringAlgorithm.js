class ScoringAlgorithm {
  calculateScore(prospect) {
    const openRate = prospect.openRate || 0;
    const clickRate = prospect.clickRate || 0;
    const replyRate = prospect.replyRate || 0;

    // Simple scoring algorithm: average of open rate, click rate, and reply rate
    const score = (openRate + clickRate + replyRate) / 3;
    return score;
  }
}

module.exports = new ScoringAlgorithm();
