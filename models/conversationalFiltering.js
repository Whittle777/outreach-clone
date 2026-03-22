// models/conversationalFiltering.js

class ConversationalFilter {
  constructor(name, filterFunction) {
    this.name = name;
    this.filterFunction = filterFunction;
  }

  apply(input) {
    return this.filterFunction(input);
  }
}

module.exports = ConversationalFilter;
