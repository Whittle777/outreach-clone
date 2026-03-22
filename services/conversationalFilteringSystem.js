// services/conversationalFilteringSystem.js

const intentDrivenShortcut = require('./intentDrivenShortcut');

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

  applyShortcut(intent, input) {
    const shortcut = intentDrivenShortcut.getShortcut(intent);
    if (shortcut) {
      return shortcut(input);
    }
    return input;
  }
}

module.exports = new ConversationalFilteringSystem();
