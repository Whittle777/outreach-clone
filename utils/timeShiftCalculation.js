// utils/timeShiftCalculation.js

/**
 * Calculates the time shift based on the given parameters.
 * @param {Date} currentTime - The current time.
 * @param {Array} timeBlocks - Array of time blocks with start and end times.
 * @returns {number} - The time shift in minutes.
 */
function calculateTimeShift(currentTime, timeBlocks) {
  let timeShift = 0;
  for (const block of timeBlocks) {
    const startTime = new Date(currentTime);
    startTime.setHours(block.start.split(':')[0]);
    startTime.setMinutes(block.start.split(':')[1]);

    const endTime = new Date(currentTime);
    endTime.setHours(block.end.split(':')[0]);
    endTime.setMinutes(block.end.split(':')[1]);

    if (currentTime >= startTime && currentTime <= endTime) {
      timeShift += (endTime - startTime) / (1000 * 60);
    }
  }
  return timeShift;
}

module.exports = {
  calculateTimeShift,
};
