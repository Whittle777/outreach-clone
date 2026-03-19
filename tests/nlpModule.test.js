const NLPModule = require('../services/nlpModule');
const assert = require('assert');

describe('NLPModule', function() {
  let nlpModule;

  beforeEach(function() {
    nlpModule = new NLPModule();
  });

  describe('train', function() {
    it('should train the classifier with provided data', function() {
      const trainingData = [
        { text: 'I love programming', category: 'positive' },
        { text: 'I hate bugs', category: 'negative' }
      ];
      nlpModule.train(trainingData);
      assert.strictEqual(nlpModule.classifier.docCount(), 2);
    });
  });

  describe('classify', function() {
    it('should classify text correctly after training', function() {
      const trainingData = [
        { text: 'I love programming', category: 'positive' },
        { text: 'I hate bugs', category: 'negative' }
      ];
      nlpModule.train(trainingData);
      const result = nlpModule.classify('I love programming');
      assert.strictEqual(result, 'positive');
    });

    it('should return a default category if not trained', function() {
      const result = nlpModule.classify('I love programming');
      assert.strictEqual(result, 'unknown');
    });
  });
});
