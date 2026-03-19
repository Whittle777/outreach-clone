const { isGDPRCompliant } = require('../utils/gdprCompliance');

describe('GDPR Compliance', () => {
  test('should return true for GDPR compliant data', () => {
    const data = {
      country: 'Germany',
      // Add other necessary fields to make the data GDPR compliant
    };

    expect(isGDPRCompliant(data)).toBe(true);
  });

  test('should return false for non-GDPR compliant data', () => {
    const data = {
      country: 'United States',
      // Add other necessary fields to make the data non-GDPR compliant
    };

    expect(isGDPRCompliant(data)).toBe(false);
  });
});
