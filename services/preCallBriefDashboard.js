const config = require('./config').getConfig();
const logger = require('./logger');
const AICallGoals = require('./aiCallGoals');
const NaturalLanguageGenerator = require('./naturalLanguageGenerator');

class PreCallBriefDashboard {
  constructor() {
    this.enabled = config.preCallBriefDashboard.enabled;
    this.aiCallGoals = new AICallGoals();
    this.naturalLanguageGenerator = new NaturalLanguageGenerator();
  }

  async generatePreCallBrief(prospectId) {
    if (!this.enabled) {
      logger.log('Pre-Call Brief Dashboard is disabled');
      return null;
    }

    try {
      const prospect = await this.getProspectById(prospectId);
      const callGoal = await this.aiCallGoals.generateCallGoal(prospect);
      const talkTrack = await this.naturalLanguageGenerator.generateTalkTrack(prospect);

      return {
        prospect,
        callGoal,
        talkTrack
      };
    } catch (error) {
      logger.error('Error generating pre-call brief', error);
      throw error;
    }
  }

  async getProspectById(prospectId) {
    // Implement logic to fetch prospect data from the database
    // For example, using Prisma:
    // return await prisma.prospect.findUnique({ where: { id: parseInt(prospectId) } });
  }
}

module.exports = PreCallBriefDashboard;
