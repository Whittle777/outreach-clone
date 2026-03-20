const config = require('../services/config').getConfig();
const doubleWriteStrategy = require('./doubleWriteStrategy');

class NaturalLanguageGuardrails {
  constructor() {
    this.policyDirectives = config.naturalLanguageGuardrails.policyDirectives;
  }

  addPolicyDirective(directive) {
    this.policyDirectives.push(directive);
  }

  enforcePolicyDirectives(text) {
    this.policyDirectives.forEach(directive => {
      if (text.includes(directive)) {
        throw new Error(`Policy directive violation: ${directive}`);
      }
    });
  }

  async write(data) {
    // Implement double-write logic for legacy datastore
    await doubleWriteStrategy.write(data);
  }

  async predictQuarterlyPerformance(data) {
    try {
      const prediction = await doubleWriteStrategy.predictQuarterlyPerformance(data);
      logger.log('Quarterly performance prediction successful', { prediction });
      return prediction;
    } catch (error) {
      logger.error('Error predicting quarterly performance', error);
      throw error;
    }
  }
}

module.exports = new NaturalLanguageGuardrails();
