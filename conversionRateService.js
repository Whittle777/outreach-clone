const { prisma } = require('../prisma');

class ConversionRateService {
  async analyzeConversionRatesBySalesStage() {
    try {
      const salesStages = ['Uncontacted', 'Bounced', 'Replied', 'Converted'];
      const conversionRates = [];

      for (const stage of salesStages) {
        const prospectsInStage = await prisma.prospect.count({
          where: { status: stage },
        });

        const totalProspects = await prisma.prospect.count();
        const conversionRate = (prospectsInStage / totalProspects) * 100;

        conversionRates.push({
          stage,
          count: prospectsInStage,
          conversionRate: conversionRate.toFixed(2),
        });
      }

      return conversionRates;
    } catch (error) {
      throw new Error('Failed to analyze conversion rates by sales stage');
    }
  }
}

module.exports = ConversionRateService;
