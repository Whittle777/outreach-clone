const ReviewQueueService = require('./reviewQueueService');
const ContextualRecordService = require('./contextualRecordService');
const AgenticActionPanelService = require('./agenticActionPanelService');

class SplitPaneReviewService {
  async getReviewQueue() {
    return await ReviewQueueService.getQueue();
  }

  async getContextualRecord(recordId) {
    return await ContextualRecordService.getRecord(recordId);
  }

  async getAgenticActionPanel(recordId) {
    return await AgenticActionPanelService.getActionPanel(recordId);
  }
}

module.exports = new SplitPaneReviewService();
