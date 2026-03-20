// services/quarterlyPerformancePrediction.js

const { QuarterlyPerformance } = require('../models/quarterlyPerformance');
const logger = require('../services/logger');

class QuarterlyPerformancePrediction {
  async getPredictions(req, res) {
    try {
      const predictions = await QuarterlyPerformance.findMany();
      logger.log('Fetched quarterly performance predictions', predictions);
      res.json(predictions);
    } catch (error) {
      logger.error('Error fetching quarterly performance predictions', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = new QuarterlyPerformancePrediction();
