const TimeBlockConfig = require('../models/timeBlockConfig');
const timeBlockConfigMiddleware = require('../middleware/timeBlockConfigMiddleware');
const express = require('express');
const bodyParser = require('body-parser');
const request = require('supertest');

describe('TimeBlockConfig', () => {
  let app;
  let timeBlock;

  beforeEach(() => {
    app = express();
    app.use(bodyParser.json());
    app.post('/timeBlockConfig', timeBlockConfigMiddleware);

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

  test('should create a new TimeBlockConfig', async () => {
    const response = await request(app)
      .post('/timeBlockConfig')
      .send({
        startTime: '2023-10-01T09:00:00Z',
        endTime: '2023-10-01T17:00:00Z',
        daysOfWeek: [1, 2, 3, 4, 5],
        holidays: ['2023-12-25'],
        user: 'user1',
        bento: 'bento1',
        activeStatus: true,
      });

    expect(response.status).toBe(200);
    expect(response.body.startTime).toBe('2023-10-01T09:00:00Z');
    expect(response.body.endTime).toBe('2023-10-01T17:00:00Z');
    expect(response.body.daysOfWeek).toEqual([1, 2, 3, 4, 5]);
    expect(response.body.holidays).toEqual(['2023-12-25']);
    expect(response.body.user).toBe('user1');
    expect(response.body.bento).toBe('bento1');
    expect(response.body.activeStatus).toBe(true);
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
