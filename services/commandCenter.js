const logger = require('./logger');
const MicrosoftTeamsIntegration = require('./microsoftTeamsIntegration');
const config = require('./config').getConfig();

class CommandCenter {
  constructor() {
    this.microsoftTeamsIntegration = new MicrosoftTeamsIntegration(config);
  }

  async handleApprovalWorkflow(user, action, data) {
    const message = `Approval workflow for ${user}: ${action} - ${JSON.stringify(data)}`;
    await this.microsoftTeamsIntegration.sendNotification(message);
    logger.log('Approval workflow notification sent to Microsoft Teams', { user, action, data });
  }
}

module.exports = CommandCenter;
