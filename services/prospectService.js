const { isValidCountryRegion } = require('../utils/validation');

class ProspectService {
  static async create(prospectData) {
    if (!isValidCountryRegion(prospectData.countryRegion)) {
      throw new Error('Invalid country/region');
    }
    return await prisma.prospect.create({
      data: prospectData,
    });
  }

  static async update(id, prospectData) {
    if (!isValidCountryRegion(prospectData.countryRegion)) {
      throw new Error('Invalid country/region');
    }
    return await prisma.prospect.update({
      where: { id: parseInt(id) },
      data: prospectData,
    });
  }

  static async markProspectAsFailed(email, bento) {
    // Update the prospect status to 'failed' in the database
    await prisma.prospect.update({
      where: { email },
      data: { status: 'failed' },
    });
  }

  static async filterProspects(filters) {
    const { countryRegion, status, tags } = filters;
    const whereClause = {};

    if (countryRegion) {
      whereClause.countryRegion = countryRegion;
    }

    if (status) {
      whereClause.status = status;
    }

    if (tags && tags.length > 0) {
      whereClause.tags = { hasSome: tags };
    }

    return await prisma.prospect.findMany({
      where: whereClause,
    });
  }
}

module.exports = ProspectService;
