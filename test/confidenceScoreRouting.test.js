const ConfidenceScoreRouting = require('../services/confidenceScoreRouting');

describe('ConfidenceScoreRouting', function() {
  let confidenceScoreRouting;

  beforeEach(function() {
    const config = {
      confidenceScoreRouting: {
        high: 85,
        moderate: 70
      }
    };
    confidenceScoreRouting = new ConfidenceScoreRouting(config);
  });

  it('should return "high" for confidence score above high threshold', function() {
    const result = confidenceScoreRouting.route(90);
    expect(result).to.equal('high');
  });

  it('should return "moderate" for confidence score above moderate threshold but below high threshold', function() {
    const result = confidenceScoreRouting.route(75);
    expect(result).to.equal('moderate');
  });

  it('should return "low" for confidence score below moderate threshold', function() {
    const result = confidenceScoreRouting.route(60);
    expect(result).to.equal('low');
  });
});
