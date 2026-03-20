const TaskQueue = require('../models/taskQueue');

class NGOETaskQueue {
  constructor(config) {
    this.config = config;
    this.queue = new TaskQueue();
  }

  async enqueue(task) {
    await this.queue.create(task);
    console.log(`Task enqueued: ${task.id}`);
  }

  async dequeue() {
    const task = await this.queue.dequeue();
    if (task) {
      console.log(`Task dequeued: ${task.id}`);
    } else {
      console.log('No tasks in the queue');
    }
    return task;
  }

  async processTasks() {
    while (true) {
      const task = await this.dequeue();
      if (task) {
        await this.executeTask(task);
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before checking the queue again
    }
  }

  async executeTask(task) {
    console.log(`Executing task: ${task.id}`);
    // Add task execution logic here
  }
}

module.exports = NGOETaskQueue;
