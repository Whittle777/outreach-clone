const natural = require('natural');

class NLPModule {
  constructor() {
    this.classifier = new natural.BayesClassifier();
  }

  train(data) {
    data.forEach(({ text, category }) => {
      this.classifier.addDocument(text, category);
    });
    this.classifier.train();
  }

  classify(text) {
    return this.classifier.classify(text);
  }
}

module.exports = NLPModule;
