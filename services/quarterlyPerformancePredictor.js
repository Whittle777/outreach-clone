// services/quarterlyPerformancePredictor.js

const QuarterlyPerformancePredictor = require('../models/quarterlyPerformancePredictor');
const config = require('../config/index');

class QuarterlyPerformancePredictorService {
  constructor() {
    this.predictor = new QuarterlyPerformancePredictor();
  }

  async trainModel(data) {
    await this.predictor.train(data);
    console.log('Model trained successfully');
  }

  async predictPerformance() {
    try {
      const prediction = await this.predictor.predict();
      console.log('Prediction made:', prediction);
      return prediction;
    } catch (error) {
      console.error('Error making prediction:', error);
      throw error;
    }
  }
}

module.exports = new QuarterlyPerformancePredictorService();
