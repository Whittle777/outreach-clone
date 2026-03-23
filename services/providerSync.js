const { getConfig } = require('../config/index');
const { Deal } = require('../models/deal');
const logger = require('../services/logger');

const config = getConfig();

class ProviderSync {
  async syncWithProvider(payload) {
    try {
      // Example: Sync deals with a provider system
      if (payload.resource === 'deal') {
        const dealData = payload.data;
        const existingDeal = await Deal.findUnique({ where: { id: dealData.id } });

        if (existingDeal) {
          await Deal.update({ where: { id: dealData.id }, data: dealData });
          logger.log('Deal updated', dealData);
        } else {
          await Deal.create(dealData);
          logger.log('Deal created', dealData);
        }
      }
    } catch (error) {
      logger.error('Error syncing with provider', error);
    }
  }
}

module.exports = new ProviderSync();
