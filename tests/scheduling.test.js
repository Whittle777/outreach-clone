const { calculateNextRun, calculateScheduledTime, intervalToMilliseconds } = require('../services/scheduling');

describe('Scheduling Logic', () => {
  describe('calculateNextRun', () => {
    it('should calculate the next run time for a daily interval', () => {
      const interval = 'daily';
      const lastRun = new Date('2023-10-01T00:00:00Z');
      const expectedNextRun = new Date('2023-10-02T00:00:00Z');
      const nextRun = calculateNextRun(interval, lastRun);
      expect(nextRun).toEqual(expectedNextRun);
    });

    it('should calculate the next run time for a weekly interval', () => {
      const interval = 'weekly';
      const lastRun = new Date('2023-10-01T00:00:00Z');
      const expectedNextRun = new Date('2023-10-08T00:00:00Z');
      const nextRun = calculateNextRun(interval, lastRun);
      expect(nextRun).toEqual(expectedNextRun);
    });

    it('should calculate the next run time for a monthly interval', () => {
      const interval = 'monthly';
      const lastRun = new Date('2023-10-01T00:00:00Z');
      const expectedNextRun = new Date('2023-11-01T00:00:00Z');
      const nextRun = calculateNextRun(interval, lastRun);
      expect(nextRun).toEqual(expectedNextRun);
    });

    it('should return the same time for an unknown interval', () => {
      const interval = 'unknown';
      const lastRun = new Date('2023-10-01T00:00:00Z');
      const expectedNextRun = lastRun;
      const nextRun = calculateNextRun(interval, lastRun);
      expect(nextRun).toEqual(expectedNextRun);
    });
  });

  describe('calculateScheduledTime', () => {
    it('should calculate the scheduled time for a given delay in days', () => {
      const delayDays = 5;
      const nextRun = new Date('2023-10-01T00:00:00Z');
      const expectedScheduledTime = new Date('2023-10-06T00:00:00Z');
      const scheduledTime = calculateScheduledTime(delayDays, nextRun);
      expect(scheduledTime).toEqual(expectedScheduledTime);
    });
  });

  describe('intervalToMilliseconds', () => {
    it('should convert daily interval to milliseconds', () => {
      const interval = 'daily';
      const expectedMilliseconds = 24 * 60 * 60 * 1000;
      const milliseconds = intervalToMilliseconds(interval);
      expect(milliseconds).toEqual(expectedMilliseconds);
    });

    it('should convert weekly interval to milliseconds', () => {
      const interval = 'weekly';
      const expectedMilliseconds = 7 * 24 * 60 * 60 * 1000;
      const milliseconds = intervalToMilliseconds(interval);
      expect(milliseconds).toEqual(expectedMilliseconds);
    });

    it('should convert monthly interval to milliseconds', () => {
      const interval = 'monthly';
      const expectedMilliseconds = 30 * 24 * 60 * 60 * 1000;
      const milliseconds = intervalToMilliseconds(interval);
      expect(milliseconds).toEqual(expectedMilliseconds);
    });

    it('should return 0 for an unknown interval', () => {
      const interval = 'unknown';
      const expectedMilliseconds = 0;
      const milliseconds = intervalToMilliseconds(interval);
      expect(milliseconds).toEqual(expectedMilliseconds);
    });
  });
});
