class TimeBlockChecker {
  constructor(approvedTimeBlocks, holidays) {
    this.approvedTimeBlocks = approvedTimeBlocks;
    this.holidays = holidays;
  }

  isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  }

  isHoliday(date) {
    const month = date.getMonth();
    const day = date.getDate();
    return this.holidays.some(holiday => holiday.month === month && holiday.day === day);
  }

  isWithinApprovedTimeBlocks(date) {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const time = hour * 60 + minute;

    return this.approvedTimeBlocks.some(block => {
      const [start, end] = block.split('-').map(time => time.split(':').map(Number));
      const startTime = start[0] * 60 + start[1];
      const endTime = end[0] * 60 + end[1];
      return time >= startTime && time < endTime;
    });
  }

  isExecutionAllowed(date) {
    return !this.isWeekend(date) && !this.isHoliday(date) && this.isWithinApprovedTimeBlocks(date);
  }
}

module.exports = TimeBlockChecker;
