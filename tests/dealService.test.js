const DealService = require('../services/dealService');

describe('DealService', () => {
  describe('scoreDeals', () => {
    it('should correctly score deals based on value and days until close', () => {
      const deals = [
        { value: 1000, closeDate: '2023-12-31' },
        { value: 2000, closeDate: '2023-11-30' },
        { value: 1500, closeDate: '2023-10-15' },
      ];

      const scoredDeals = DealService.scoreDeals(deals);

      expect(scoredDeals[0].score).toBeCloseTo(1000 / 365);
      expect(scoredDeals[1].score).toBeCloseTo(2000 / 30);
      expect(scoredDeals[2].score).toBeCloseTo(1500 / 15);
    });
  });

  describe('getTopPrioritizedDeals', () => {
    it('should return the top 10 prioritized deals', async () => {
      const deals = [
        { value: 1000, closeDate: '2023-12-31' },
        { value: 2000, closeDate: '2023-11-30' },
        { value: 1500, closeDate: '2023-10-15' },
        { value: 500, closeDate: '2023-09-01' },
        { value: 3000, closeDate: '2023-08-01' },
        { value: 2500, closeDate: '2023-07-01' },
        { value: 2000, closeDate: '2023-06-01' },
        { value: 1500, closeDate: '2023-05-01' },
        { value: 1000, closeDate: '2023-04-01' },
        { value: 500, closeDate: '2023-03-01' },
        { value: 600, closeDate: '2023-02-01' },
      ];

      jest.spyOn(DealService, 'scoreDeals').mockResolvedValueOnce(deals);

      const topDeals = await DealService.getTopPrioritizedDeals();

      expect(topDeals.length).toBe(10);
      expect(topDeals[0].value).toBe(3000);
      expect(topDeals[9].value).toBe(600);
    });
  });
});
