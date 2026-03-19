class DealHealthCalculator {
  constructor() {
    // Initialize any necessary properties or dependencies here
  }

  calculateDealHealthScore(prospect) {
    // Implement the logic to calculate the deal health score
    // This is a placeholder implementation
    let score = 0;

    // Example factors for deal health score calculation
    if (prospect.status === 'Engaged') {
      score += 20;
    }
    if (prospect.recentActivity) {
      score += 30;
    }
    if (prospect.momentum > 0.5) {
      score += 50;
    }

    return score;
  }

  calculateConversionRateByForecastCategory(prospects, forecastCategory) {
    const filteredProspects = prospects.filter(prospect => prospect.forecastCategory === forecastCategory);
    if (filteredProspects.length === 0) {
      return 0;
    }

    const convertedProspects = filteredProspects.filter(prospect => prospect.status === 'Converted');
    const conversionRate = (convertedProspects.length / filteredProspects.length) * 100;
    return conversionRate;
  }
}

module.exports = DealHealthCalculator;
