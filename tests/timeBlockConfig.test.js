const TimeBlockConfig = require('../services/timeBlockConfig');

describe('TimeBlockConfig', () => {
  let timeBlock;

  beforeEach(() => {
    timeBlock = new TimeBlockConfig(
      new Date('2023-10-01T09:00:00Z'),
      new Date('2023-10-01T17:00:00Z'),
      [1, 2, 3, 4, 5], // Monday to Friday
      ['2023-12-25'], // Christmas
      'user1',
      'bento1',
      true
    );
  });

  test('should check if a time is within the time block', () => {
    const withinTime = new Date('2023-10-01T12:00:00Z');
    expect(timeBlock.isWithinTimeBlock(withinTime)).toBe(true);

    const outsideTime = new Date('2023-10-01T08:00:00Z');
    expect(timeBlock.isWithinTimeBlock(outsideTime)).toBe(false);
  });

  test('should check if a time block is active', () => {
    expect(timeBlock.isActive()).toBe(true);

    timeBlock.activeStatus = false;
    expect(timeBlock.isActive()).toBe(false);
  });

  test('should check if a time is within the time block on a holiday', () => {
    const holidayTime = new Date('2023-12-25T12:00:00Z');
    expect(timeBlock.isWithinTimeBlock(holidayTime)).toBe(false);
  });

  test('should check if a time is within the time block on a non-working day', () => {
    const weekendTime = new Date('2023-10-07T12:00:00Z'); // Saturday
    expect(timeBlock.isWithinTimeBlock(weekendTime)).toBe(false);
  });
});
