const prisma = require('../prismaClient');

class Prospect {
  static async create(prospectData) {
    return await prisma.prospect.create({
      data: prospectData,
    });
  }

  static async findById(id) {
    return await prisma.prospect.findUnique({
      where: { id: parseInt(id) },
    });
  }

  static async findAll() {
    return await prisma.prospect.findMany();
  }

  static async update(id, prospectData) {
    return await prisma.prospect.update({
      where: { id: parseInt(id) },
      data: prospectData,
    });
  }

  static async delete(id) {
    return await prisma.prospect.delete({
      where: { id: parseInt(id) },
    });
  }

  static async markProspectAsFailed(email, bento) {
    return await prisma.prospect.update({
      where: { email },
      data: { status: 'failed', bento },
    });
  }
}

module.exports = Prospect;
