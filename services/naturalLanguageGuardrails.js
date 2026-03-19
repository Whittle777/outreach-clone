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
}

module.exports = new NaturalLanguageGuardrails();
