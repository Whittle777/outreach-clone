const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class TaskQueue {
  async create(task) {
    return await prisma.task.create({
      data: task,
    });
  }

  async dequeue() {
    const task = await prisma.task.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    if (task) {
      await prisma.task.delete({
        where: { id: task.id },
      });
    }
    return task;
  }
}

module.exports = TaskQueue;
