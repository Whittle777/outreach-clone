const assert = require('assert');
const { isCurrentTimeWithinApprovedBlocks } = require('../utils/timeUtils');

describe('Time Shifting Logic', function() {
  it('should return true if current time is within approved blocks', function() {
    const timeBlocks = [
      { start: '09:00', end: '17:00' },
      { start: '19:00', end: '21:00' }
    ];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    if (currentHour >= 9 && currentHour < 17) {
      assert.strictEqual(isCurrentTimeWithinApprovedBlocks(timeBlocks), true);
    } else if (currentHour >= 19 && currentHour < 21) {
      assert.strictEqual(isCurrentTimeWithinApprovedBlocks(timeBlocks), true);
    } else {
      assert.strictEqual(isCurrentTimeWithinApprovedBlocks(timeBlocks), false);
    }
  });

  it('should return false if current time is not within approved blocks', function() {
    const timeBlocks = [
      { start: '09:00', end: '17:00' },
      { start: '19:00', end: '21:00' }
    ];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    if (currentHour < 9 || (currentHour >= 17 && currentHour < 19) || currentHour >= 21) {
      assert.strictEqual(isCurrentTimeWithinApprovedBlocks(timeBlocks), false);
    } else {
      assert.strictEqual(isCurrentTimeWithinApprovedBlocks(timeBlocks), true);
    }
  });
});
