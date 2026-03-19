class DealHealthScore {
  static calculateScore(metadata) {
    // Implement the logic to calculate the deal health score
    // This is a placeholder implementation
    let score = 0;

    // Example factors for deal health score calculation
    if (metadata.status === 'Engaged') {
      score += 20;
    }
    if (metadata.recentActivity) {
      score += 30;
    }
    if (metadata.momentum > 0.5) {
      score += 50;
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
