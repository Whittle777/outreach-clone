// services/naturalLanguageGuardrails.js

const config = require('../services/config').getConfig();

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
}

module.exports = new NaturalLanguageGuardrails();
