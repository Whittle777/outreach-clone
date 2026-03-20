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
}

module.exports = ProspectService;
