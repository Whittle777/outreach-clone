// tests/conversationalFilteringSystem.test.js

const ConversationalFilteringSystem = require('../services/conversationalFilteringSystem');

describe('ConversationalFilteringSystem', () => {
  let conversationalFilteringSystem;

  beforeEach(() => {
    conversationalFilteringSystem = new ConversationalFilteringSystem();
  });

  describe('addFilter', () => {
    it('should add a filter to the filters array', () => {
      const filter = (input) => input.toUpperCase();
      conversationalFilteringSystem.addFilter(filter);
      expect(conversationalFilteringSystem.filters).toContain(filter);
    });
  });

  describe('applyFilters', () => {
    it('should apply all filters to the input', () => {
      const filter1 = (input) => input.toUpperCase();
      const filter2 = (input) => input.split('').reverse().join('');
      conversationalFilteringSystem.addFilter(filter1);
      conversationalFilteringSystem.addFilter(filter2);
      const result = conversationalFilteringSystem.applyFilters('hello');
      expect(result).toBe('OLLEH');
    });

    it('should return the input unchanged if no filters are added', () => {
      const result = conversationalFilteringSystem.applyFilters('hello');
      expect(result).toBe('hello');
    });
  });
});
