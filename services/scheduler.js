const cron = require('node-cron');
const TaskQueue = require('./taskQueue');
const taskQueue = new TaskQueue();
const AIAgent = require('./aiAgent');
const aiAgent = new AIAgent();

class Scheduler {
  scheduleTaskProcessing() {
    cron.schedule('*/1 * * * *', async () => {
      console.log('Processing pending AI agent tasks...');
      const pendingTasks = await taskQueue.getPendingTasks();
      for (const task of pendingTasks) {
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
