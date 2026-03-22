// tests/timeShiftCalculation.test.js

const { calculateTimeShift } = require('../utils/timeShiftCalculation');
const moment = require('moment');

describe('calculateTimeShift', () => {
  it('should calculate time shift correctly within a single time block', () => {
    const currentTime = moment('2023-10-01T12:30:00').toDate();
    const timeBlocks = [
      { start: '12:00', end: '13:00' },
    ];
    const expectedShift = 30; // 30 minutes from 12:00 to 12:30
    expect(calculateTimeShift(currentTime, timeBlocks)).toBe(expectedShift);
  });

  it('should calculate time shift correctly across multiple time blocks', () => {
    const currentTime = moment('2023-10-01T14:45:00').toDate();
    const timeBlocks = [
      { start: '12:00', end: '13:00' },
      { start: '14:00', end: '15:00' },
    ];
    const expectedShift = 60 + 45; // 60 minutes from 12:00 to 13:00 and 45 minutes from 14:00 to 14:45
    expect(calculateTimeShift(currentTime, timeBlocks)).toBe(expectedShift);
  });

  it('should return 0 if current time is outside all time blocks', () => {
    const currentTime = moment('2023-10-01T11:00:00').toDate();
    const timeBlocks = [
      { start: '12:00', end: '13:00' },
      { start: '14:00', end: '15:00' },
    ];
    const expectedShift = 0;
    expect(calculateTimeShift(currentTime, timeBlocks)).toBe(expectedShift);
  });
});
