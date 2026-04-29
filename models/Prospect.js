const prisma = require('../services/database');

class Prospect {
  static async create(prospectData) {
    return await prisma.prospect.create({
      data: prospectData,
    });
  }

  static async createMany(prospectsArray) {
    const ALLOWED_FIELDS = new Set([
      'firstName', 'lastName', 'email', 'companyName', 'title', 'phone',
      'enrichmentStatus', 'status', 'notes', 'country', 'region',
      'techStack', 'tags', 'trackingPixelData',
    ]);
    const sanitized = prospectsArray.map(p =>
      Object.fromEntries(Object.entries(p).filter(([k]) => ALLOWED_FIELDS.has(k)))
    );
    const existing = await prisma.prospect.findMany({
      where: { email: { in: sanitized.map(p => p.email) } },
      select: { email: true }
    });
    const existingEmails = new Set(existing.map(p => p.email));
    const newProspects = sanitized.filter(p => !existingEmails.has(p.email));
    if (newProspects.length === 0) return { count: 0 };
    return await prisma.prospect.createMany({
      data: newProspects
    });
  }

  static async findById(id) {
    return await prisma.prospect.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { sequenceEnrollments: true }
        }
      }
    });
  }

  static async findAll() {
    return await prisma.prospect.findMany({
      include: {
        _count: {
          select: {
            sequenceEnrollments: true,
            emailActivities:     true,
            callActivities:      true,
            replyActivities:     true,
            meetingActivities:   true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
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

  static async updateScore(id, score) {
    return await prisma.prospect.update({
      where: { id: parseInt(id) },
      data: { score },
    });
  }
}

module.exports = Prospect;
