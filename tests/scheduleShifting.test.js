const { expect } = require('chai');
const ScheduleShifting = require('../services/scheduleShifting');

describe('Schedule Shifting', () => {
  it('should return the current time if it is within approved time blocks', () => {
    const currentTime = new Date('2023-10-01T10:00:00Z');
    const approvedTimeBlocks = ['09:00 - 12:00', '13:00 - 17:00'];
    const shiftedTime = ScheduleShifting.shiftSchedule(currentTime, approvedTimeBlocks);
    expect(shiftedTime).to.deep.equal(currentTime);
  });

  it('should shift to the next available approved time block if current time is not within any block', () => {
    const currentTime = new Date('2023-10-01T18:00:00Z');
    const approvedTimeBlocks = ['09:00 - 12:00', '13:00 - 17:00'];
    const nextBlockStart = new Date('2023-10-01T09:00:00Z');
    const shiftedTime = ScheduleShifting.shiftSchedule(currentTime, approvedTimeBlocks);
    expect(shiftedTime).to.deep.equal(nextBlockStart);
  });

  it('should handle edge cases where current time is exactly at the boundary of a time block', () => {
    const currentTime = new Date('2023-10-01T12:00:00Z');
    const approvedTimeBlocks = ['09:00 - 12:00', '13:00 - 17:00'];
    const shiftedTime = ScheduleShifting.shiftSchedule(currentTime, approvedTimeBlocks);
    expect(shiftedTime).to.deep.equal(currentTime);
  });
});
