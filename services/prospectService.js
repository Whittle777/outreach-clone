const { isValidCountryRegion } = require('../utils/validation');
const dynamicKnowledgeGraphs = require('../services/dynamicKnowledgeGraphs');

class ProspectService {
  static async create(prospectData) {
    if (!isValidCountryRegion(prospectData.countryRegion)) {
      throw new Error('Invalid country/region');
    }
    const prospect = await prisma.prospect.create({
      data: prospectData,
    });
    dynamicKnowledgeGraphs.addNode(prospect);
    return prospect;
  }

  static async update(id, prospectData) {
    if (!isValidCountryRegion(prospectData.countryRegion)) {
      throw new Error('Invalid country/region');
    }
    const updatedProspect = await prisma.prospect.update({
      where: { id: parseInt(id) },
      data: prospectData,
    });
    dynamicKnowledgeGraphs.addNode(updatedProspect);
    return updatedProspect;
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

  static async addProspectConnection(prospectId, connectedProspectId) {
    dynamicKnowledgeGraphs.addConnection(prospectId, connectedProspectId);
  }

  static async getKnowledgeGraph() {
    return dynamicKnowledgeGraphs.getGraph();
  }
}

module.exports = ProspectService;
