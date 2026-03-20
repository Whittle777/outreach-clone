const prisma = require('../services/database');
const DealHealthScore = require('../models/dealHealthScore');
const DealHealthScoreCalculator = require('../services/dealHealthScore');

class Prospects {
  static async create(prospectData) {
    const prospect = await prisma.prospect.create({
      data: prospectData,
    });

    // Calculate and create deal health score
    const score = DealHealthScoreCalculator.calculate(prospect);
    await DealHealthScore.create({
      score,
      status: score >= 80 ? 'High' : (score >= 50 ? 'Medium' : 'Low'),
      prospectId: prospect.id,
    });

    return prospect;
  }

  static async update(id, prospectData) {
    const prospect = await prisma.prospect.update({
      where: { id: parseInt(id) },
      data: prospectData,
    });

    // Update deal health score
    const score = DealHealthScoreCalculator.calculate(prospect);
    await DealHealthScore.update(prospect.id, {
      score,
      status: score >= 80 ? 'High' : (score >= 50 ? 'Medium' : 'Low'),
    });

    return prospect;
  }

  static async delete(id) {
    await DealHealthScore.delete(id);
    return await prisma.prospect.delete({
      where: { id: parseInt(id) },
    });
  }

  static async getAll() {
    return await prisma.prospect.findMany();
  }
}

module.exports = Prospects;
