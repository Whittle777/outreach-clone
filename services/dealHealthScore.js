class DealHealthScoreCalculator {
  static calculate(prospect) {
    // Example scoring algorithm
    let score = 0;

    // Example factors: recent activity, status, etc.
    if (prospect.recentActivity) {
      score += 20;
    }

    if (prospect.status === 'Engaged') {
      score += 20;
    }

    if (prospect.recentEmailOpens > 0) {
      score += 10;
    }

    if (prospect.recentClicks > 0) {
      score += 10;
    }

    // Ensure score is within 0-100 range
    score = Math.min(Math.max(score, 0), 100);

    return score;
  }
}

module.exports = DealHealthScoreCalculator;
