class ScheduleShifting {
  static shiftSchedule(currentTime, approvedTimeBlocks) {
    // Basic implementation: check if current time is within approved time blocks
    for (const block of approvedTimeBlocks) {
      const [start, end] = block.split('-').map(time => new Date(time.trim()));
      if (currentTime >= start && currentTime <= end) {
        return currentTime; // Current time is within approved time blocks
      }
    }
    // If current time is not within approved time blocks, shift to the next available block
    const nextBlock = approvedTimeBlocks[0].split('-').map(time => new Date(time.trim()));
    return nextBlock[0]; // Shift to the start of the first approved time block
  }
}

module.exports = ScheduleShifting;
