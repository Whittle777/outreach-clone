const logger = require('./logger');

class AIService {
  async generateCallGoal(prospect) {
    try {
      // Simulate AI-generated call goal
      const callGoal = `Discuss the benefits of our product with ${prospect.name} from ${prospect.companyName}.`;
      return callGoal;
    } catch (error) {
      logger.error('Error generating call goal in AI service', error);
      throw error;
    }
  }
}

module.exports = new AIService();
