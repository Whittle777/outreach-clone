class NGOETaskQueue {
  constructor(config) {
    this.config = config;
    this.queue = [];
  }

  async enqueue(task) {
    this.queue.push(task);
    console.log(`Task enqueued: ${task.id}`);
  }

  async dequeue() {
    if (this.queue.length === 0) {
      console.log('No tasks in the queue');
      return null;
    }
    const task = this.queue.shift();
    console.log(`Task dequeued: ${task.id}`);
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
