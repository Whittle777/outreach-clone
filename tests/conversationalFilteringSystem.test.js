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

    it('should handle multiple filters correctly', () => {
      const filter1 = (input) => input.replace(/o/g, '0');
      const filter2 = (input) => input.split('').reverse().join('');
      const filter3 = (input) => input.toUpperCase();
      conversationalFilteringSystem.addFilter(filter1);
      conversationalFilteringSystem.addFilter(filter2);
      conversationalFilteringSystem.addFilter(filter3);
      const result = conversationalFilteringSystem.applyFilters('hello world');
      expect(result).toBe('DLROW 0LL0H');
    });

    it('should handle no filters correctly', () => {
      const result = conversationalFilteringSystem.applyFilters('hello world');
      expect(result).toBe('hello world');
    });

    it('should handle empty input correctly', () => {
      const result = conversationalFilteringSystem.applyFilters('');
      expect(result).toBe('');
    });
  });
});
