// services/naturalLanguageGuardrails.js

class NaturalLanguageGuardrails {
  constructor() {
    this.policyDirectives = [];
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
    // For now, let's assume it's a no-op
    await doubleWriteStrategy.write(data);
  }
}

module.exports = new NaturalLanguageGuardrails();
