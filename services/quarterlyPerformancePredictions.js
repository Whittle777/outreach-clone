const mlModel = require('./mlModel');
const logger = require('../services/logger');

class QuarterlyPerformancePredictions {
  constructor() {
    // Initialize any necessary resources here
  }

  async predictPerformance(data) {
    try {
      const prediction = await mlModel.predict(data);
      logger.log('Quarterly performance prediction successful', { prediction });
      return prediction;
    } catch (error) {
      logger.error('Error predicting quarterly performance', error);
      throw error;
    }
  }
}

module.exports = new QuarterlyPerformancePredictions();
