const fuzzysearch = require('fuzzysearch');

class PredictiveSearch {
  constructor(config) {
    this.config = config;
    this.data = [];
  }

  async train(data) {
    this.data = data;
  }

  async search(query) {
    const results = this.data.filter(item => fuzzysearch(query.toLowerCase(), item.name.toLowerCase()));
    return { results };
  }
}

module.exports = PredictiveSearch;
