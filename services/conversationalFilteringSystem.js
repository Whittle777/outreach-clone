// services/conversationalFilteringSystem.js

const intentDrivenShortcut = require('./intentDrivenShortcut');
const PredictiveSearch = require('./predictiveSearch');

class ConversationalFilteringSystem {
  constructor(config) {
    this.filters = [];
    this.predictiveSearch = new PredictiveSearch(config);
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

  applyShortcut(intent, input) {
    const shortcut = intentDrivenShortcut.getShortcut(intent);
    if (shortcut) {
      return shortcut(input);
    }
    return input;
  }

  async search(query) {
    return await this.predictiveSearch.search(query);
  }
}

module.exports = new ConversationalFilteringSystem();
