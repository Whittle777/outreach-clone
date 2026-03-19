const moment = require('moment');

/**
 * Checks if the current time is within any of the approved time blocks.
 * @param {Array} timeBlocks - An array of time blocks, each represented as an object with 'start' and 'end' properties in 'HH:mm' format.
 * @returns {boolean} - True if the current time is within any of the approved time blocks, false otherwise.
 */
function isCurrentTimeWithinApprovedBlocks(timeBlocks) {
  const now = moment();
  for (const block of timeBlocks) {
    const startTime = moment(block.start, 'HH:mm');
    const endTime = moment(block.end, 'HH:mm');
    if (now.isBetween(startTime, endTime, 'minutes', '[]')) {
      return true;
    }
  }
  return false;
}

module.exports = {
  isCurrentTimeWithinApprovedBlocks,
};
