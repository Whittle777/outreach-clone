class DealHealthScoreCalculator {
  static calculate(prospect) {
    // Example scoring logic
    let score = 0;

    // Example factors: recent activity, engagement, etc.
    if (prospect.recentActivity) {
      score += 20;
    }
    if (prospect.engagement > 50) {
      score += 30;
    }
    if (prospect.momentum > 70) {
      score += 50;
    }

    // Ensure score is within 0-100 range
    score = Math.min(Math.max(score, 0), 100);

    return score;
  }
}

module.exports = DealHealthScoreCalculator;
