const assert = require('assert');
const { calculateNextRun, calculateScheduledTime, intervalToMilliseconds } = require('../services/scheduling');

describe('Scheduling Logic', function() {
  describe('calculateNextRun', function() {
    it('should calculate the next run time for daily interval', function() {
      const interval = 'daily';
      const lastRun = new Date('2023-10-01T09:00:00Z');
      const expectedNextRun = new Date('2023-10-02T09:00:00Z');
      assert.deepStrictEqual(calculateNextRun(interval, lastRun), expectedNextRun);
    });

    it('should calculate the next run time for weekly interval', function() {
      const interval = 'weekly';
      const lastRun = new Date('2023-10-01T09:00:00Z');
      const expectedNextRun = new Date('2023-10-08T09:00:00Z');
      assert.deepStrictEqual(calculateNextRun(interval, lastRun), expectedNextRun);
    });

    it('should calculate the next run time for monthly interval', function() {
      const interval = 'monthly';
      const lastRun = new Date('2023-10-01T09:00:00Z');
      const expectedNextRun = new Date('2023-11-01T09:00:00Z');
      assert.deepStrictEqual(calculateNextRun(interval, lastRun), expectedNextRun);
    });
  });

  describe('calculateScheduledTime', function() {
    it('should calculate the scheduled time based on delay days', function() {
      const delayDays = 5;
      const nextRun = new Date('2023-10-01T09:00:00Z');
      const expectedScheduledTime = new Date('2023-10-06T09:00:00Z');
      assert.deepStrictEqual(calculateScheduledTime(delayDays, nextRun), expectedScheduledTime);
    });
  });

  describe('intervalToMilliseconds', function() {
    it('should convert daily interval to milliseconds', function() {
      const interval = 'daily';
      const expectedMilliseconds = 24 * 60 * 60 * 1000;
      assert.strictEqual(intervalToMilliseconds(interval), expectedMilliseconds);
    });

    it('should convert weekly interval to milliseconds', function() {
      const interval = 'weekly';
      const expectedMilliseconds = 7 * 24 * 60 * 60 * 1000;
      assert.strictEqual(intervalToMilliseconds(interval), expectedMilliseconds);
    });

    it('should convert monthly interval to milliseconds', function() {
      const interval = 'monthly';
      const expectedMilliseconds = 30 * 24 * 60 * 60 * 1000;
      assert.strictEqual(intervalToMilliseconds(interval), expectedMilliseconds);
    });
  });
});
