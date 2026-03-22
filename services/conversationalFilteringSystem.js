// services/conversationalFilteringSystem.js

class ConversationalFilteringSystem {
  constructor() {
    this.filters = [];
  }

  addFilter(filter) {
    this.filters.push(filter);
  }

  applyFilters(input) {
    let result = input;
    for (const filter of this.filters) {
      result = filter(result);
    }
    return result;
  }
}

module.exports = new ConversationalFilteringSystem();
