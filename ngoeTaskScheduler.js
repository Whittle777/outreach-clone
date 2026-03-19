class NGOETaskScheduler {
  constructor() {
    this.tasks = [];
  }

  addTask(task) {
    this.tasks.push(task);
  }

  removeTask(taskId) {
    this.tasks = this.tasks.filter(task => task.id !== taskId);
  }

  async scheduleTasks() {
    for (const task of this.tasks) {
      await this.executeTask(task);
    }
  }

  async executeTask(task) {
    // Placeholder for task execution logic
    console.log(`Executing task: ${task.name}`);
  }
}

module.exports = NGOETaskScheduler;
