const Scheduler = require('../services/scheduler');
const TaskQueue = require('../services/taskQueue');
const AIAgent = require('../services/aiAgent');
const TimeBlockConfig = require('../services/timeBlockConfig');
const config = require('../config');

jest.mock('../services/taskQueue');
jest.mock('../services/aiAgent');
jest.mock('../services/timeBlockConfig');
jest.mock('../config');

describe('Scheduler', () => {
  let scheduler;
  let taskQueue;
  let aiAgent;
  let timeBlockConfig;

  beforeEach(() => {
    taskQueue = new TaskQueue();
    aiAgent = new AIAgent();
    timeBlockConfig = new TimeBlockConfig();
    scheduler = new Scheduler();
    config.timeBlockCheckEnabled = true;
    config.timeBlocks = [
      {
        start: '2023-10-01T09:00:00Z',
        end: '2023-10-01T17:00:00Z',
        daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
        holidayExclusions: ['2023-12-25'], // Christmas
        userOrTeamAssociation: 'user1',
        bentoIdentifier: 'bento1',
        activeStatus: true
      }
    ];
  });

  test('should process pending tasks within time block', async () => {
    const pendingTasks = [
      { id: 1, userOrTeamAssociation: 'user1' },
      { id: 2, userOrTeamAssociation: 'user2' }
    ];
    taskQueue.getPendingTasks.mockResolvedValue(pendingTasks);
    timeBlockConfig.isActive.mockReturnValue(true);
    timeBlockConfig.isWithinTimeBlock.mockReturnValue(true);

    await scheduler.scheduleTaskProcessing();

    expect(taskQueue.getPendingTasks).toHaveBeenCalled();
    expect(aiAgent.sendTask).toHaveBeenCalledWith(pendingTasks[0]);
    expect(taskQueue.updateTask).toHaveBeenCalledWith(pendingTasks[0].id, 'PROCESSING');
    expect(aiAgent.sendTask).toHaveBeenCalledWith(pendingTasks[1]);
    expect(taskQueue.updateTask).toHaveBeenCalledWith(pendingTasks[1].id, 'PROCESSING');
  });

  test('should skip tasks outside time block', async () => {
    const pendingTasks = [
      { id: 1, userOrTeamAssociation: 'user1' }
    ];
    taskQueue.getPendingTasks.mockResolvedValue(pendingTasks);
    timeBlockConfig.isActive.mockReturnValue(true);
    timeBlockConfig.isWithinTimeBlock.mockReturnValue(false);

    await scheduler.scheduleTaskProcessing();

    expect(taskQueue.getPendingTasks).toHaveBeenCalled();
    expect(aiAgent.sendTask).not.toHaveBeenCalled();
    expect(taskQueue.updateTask).not.toHaveBeenCalled();
  });

  test('should handle errors when sending tasks', async () => {
    const pendingTasks = [
      { id: 1, userOrTeamAssociation: 'user1' }
    ];
    taskQueue.getPendingTasks.mockResolvedValue(pendingTasks);
    timeBlockConfig.isActive.mockReturnValue(true);
    timeBlockConfig.isWithinTimeBlock.mockReturnValue(true);
    aiAgent.sendTask.mockRejectedValue(new Error('Task sending failed'));

    await scheduler.scheduleTaskProcessing();

    expect(taskQueue.getPendingTasks).toHaveBeenCalled();
    expect(aiAgent.sendTask).toHaveBeenCalledWith(pendingTasks[0]);
    expect(taskQueue.updateTask).toHaveBeenCalledWith(pendingTasks[0].id, 'ERROR');
  });
});
