// quarterlyPerformanceService.js

const QuarterlyPerformance = require('../models/QuarterlyPerformance');
const PredictionService = require('../path/to/predictionService');
const config = require('../config/config');

class QuarterlyPerformanceService {
  constructor() {
    this.predictionService = new PredictionService(config.predictionApiKey);
  }

  async getQuarterlyPerformance(quarterIdentifier) {
    return QuarterlyPerformance.findOne({ where: { quarterIdentifier } });
  }

  async updateQuarterlyPerformance(quarterData) {
    const { quarterIdentifier, predictedRevenue, confidenceInterval, seasonalityFactors, predictionTimestamp } = quarterData;
    await QuarterlyPerformance.update(
      { predictedRevenue, confidenceInterval, seasonalityFactors, predictionTimestamp },
      { where: { quarterIdentifier } }
    );
  }

  async predictQuarterlyPerformance(quarterData) {
    const prediction = await this.predictionService.predict(quarterData);
    return prediction;
  }
}

module.exports = QuarterlyPerformanceService;
