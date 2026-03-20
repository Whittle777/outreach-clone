const cron = require('node-cron');
const TaskQueue = require('./taskQueue');
const taskQueue = new TaskQueue();
const AIAgent = require('./aiAgent');
const aiAgent = new AIAgent();
const TimeBlockConfig = require('../models/TimeBlockConfig');
const config = require('../config');

class Scheduler {
  scheduleTaskProcessing() {
    cron.schedule('*/1 * * * *', async () => {
      console.log('Processing pending AI agent tasks...');
      const pendingTasks = await taskQueue.getPendingTasks();
      const currentTime = new Date();

      for (const task of pendingTasks) {
        if (config.timeBlockCheckEnabled) {
          const timeBlocks = config.timeBlocks.map(block => new TimeBlockConfig(
            new Date(block.start),
            new Date(block.end),
            block.daysOfWeek,
            block.holidayExclusions,
            block.userOrTeamAssociation,
            block.bentoIdentifier,
            block.activeStatus
          ));

          const isWithinTimeBlock = timeBlocks.some(block => block.isActive() && block.isWithinTimeBlock(currentTime));

          if (!isWithinTimeBlock) {
            console.log('Skipping task due to time block restrictions:', task.id);
            continue;
          }
        }

        try {
          await aiAgent.sendTask(task);
          await taskQueue.updateTask(task.id, 'PROCESSING');
          console.log('Task sent to AI agent:', task.id);
        } catch (error) {
          console.error('Error sending task to AI agent:', error);
          await taskQueue.updateTask(task.id, 'ERROR');
        }
      }
    });
  }
}

module.exports = Scheduler;
