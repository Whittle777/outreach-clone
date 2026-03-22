const logger = require('../services/logger');
const temporalStateManager = require('../services/temporalStateManager');

class HitlWorkflow {
  constructor() {
    this.reviewQueue = [];
  }

  async routeCallByConfidenceScore(callData, confidenceScore) {
    if (confidenceScore > 85) {
      // High confidence: AI executes autonomously
      logger.info('High confidence call routed autonomously', { callData, confidenceScore });
      // Implement AI execution logic here
    } else if (confidenceScore >= 70) {
      // Moderate confidence: Pause and route to review queue
      await this.pauseAndRouteToReviewQueue(callData);
      logger.info('Moderate confidence call routed to review queue', { callData, confidenceScore });
    } else {
      // Low confidence: Workflow halts with high-priority supervisor notifications
      await this.haltAndNotifySupervisor(callData);
      logger.info('Low confidence call halted with supervisor notifications', { callData, confidenceScore });
    }
  }

  async pauseAndRouteToReviewQueue(callData) {
    this.reviewQueue.push(callData);
    temporalStateManager.saveState('reviewQueue', this.reviewQueue);
    logger.warn('Call paused and routed to review queue', { callData });
    // Implement logic to notify supervisors or review queue system
  }

  async haltAndNotifySupervisor(callData) {
    // Implement logic to halt the call and notify supervisor
    // This could involve sending an alert or message to a supervisor
    logger.error('Call halted with supervisor notifications', { callData });
    // Implement notification logic here
  }

  async getReviewQueue() {
    return this.reviewQueue;
  }

  async clearReviewQueue() {
    this.reviewQueue = [];
    temporalStateManager.clearState('reviewQueue');
    logger.info('Review queue cleared');
  }
}

module.exports = new HitlWorkflow();
