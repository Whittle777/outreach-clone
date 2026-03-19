// tests/sentimentAnalysis.test.js

const SentimentAnalysis = require('../services/sentimentAnalysis');
const assert = require('assert');

describe('Sentiment Analysis', function() {
  let sentimentAnalysis;

  beforeEach(function() {
    sentimentAnalysis = new SentimentAnalysis('test-api-key');
  });

  it('should analyze positive sentiment', function() {
    const text = 'I love this product!';
    const result = sentimentAnalysis.analyze(text);
    assert.strictEqual(result, 'positive');
  });

  it('should analyze negative sentiment', function() {
    const text = 'I hate this product!';
    const result = sentimentAnalysis.analyze(text);
    assert.strictEqual(result, 'negative');
  });

  it('should analyze neutral sentiment', function() {
    const text = 'This product is okay.';
    const result = sentimentAnalysis.analyze(text);
    assert.strictEqual(result, 'neutral');
  });

  it('should handle empty text', function() {
    const text = '';
    const result = sentimentAnalysis.analyze(text);
    assert.strictEqual(result, 'neutral');
  });

  it('should handle punctuation', function() {
    const text = 'Wow!!! This is amazing!!!';
    const result = sentimentAnalysis.analyze(text);
    assert.strictEqual(result, 'positive');
  });

  it('should handle mixed sentiment', function() {
    const text = 'I like some parts of this product, but I dislike others.';
    const result = sentimentAnalysis.analyze(text);
    assert.strictEqual(result, 'neutral');
  });
});
