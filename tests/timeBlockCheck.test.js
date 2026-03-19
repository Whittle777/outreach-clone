const assert = require('assert');
const { isTimeBlockAllowed } = require('../services/scheduleShifting');

describe('Time Block Check', function() {
  it('should return true if the time block is allowed', function() {
    const timeBlock = { start: '09:00', end: '17:00' };
    const currentTime = '10:00';
    assert.strictEqual(isTimeBlockAllowed(timeBlock, currentTime), true);
  });

  it('should return false if the time block is not allowed', function() {
    const timeBlock = { start: '09:00', end: '17:00' };
    const currentTime = '18:00';
    assert.strictEqual(isTimeBlockAllowed(timeBlock, currentTime), false);
  });

  it('should return true if the current time is exactly at the start of the block', function() {
    const timeBlock = { start: '09:00', end: '17:00' };
    const currentTime = '09:00';
    assert.strictEqual(isTimeBlockAllowed(timeBlock, currentTime), true);
  });

  it('should return true if the current time is exactly at the end of the block', function() {
    const timeBlock = { start: '09:00', end: '17:00' };
    const currentTime = '17:00';
    assert.strictEqual(isTimeBlockAllowed(timeBlock, currentTime), true);
  });
});
