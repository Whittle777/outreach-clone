// services/taskQueue.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class TaskQueue {
  async addTask(task) {
    return await prisma.task.create({
      data: task,
    });
  }

  async getPendingTasks() {
    return await prisma.task.findMany({
      where: { status: 'PENDING' },
    });
  }

  async updateTask(id, status) {
    return await prisma.task.update({
      where: { id: parseInt(id) },
      data: { status },
    });
  }
}

module.exports = new TaskQueue();
