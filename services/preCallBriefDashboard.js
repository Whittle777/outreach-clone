const config = require('./config').getConfig();
const logger = require('./logger');
const AICallGoals = require('./aiCallGoals');
const NaturalLanguageGenerator = require('./naturalLanguageGenerator');
const WebSocket = require('ws');
const RealTimeUpdates = require('./realTimeUpdates');

class PreCallBriefDashboard {
  constructor() {
    this.enabled = config.preCallBriefDashboard.enabled;
    this.aiCallGoals = new AICallGoals();
    this.naturalLanguageGenerator = new NaturalLanguageGenerator();
    this.ws = new WebSocket(`ws://localhost:${config.webSocket.port}`);
    this.realTimeUpdates = new RealTimeUpdates();

    this.ws.on('open', () => {
      logger.log('Connected to WebSocket server');
    });

    this.ws.on('message', async (message) => {
      const data = JSON.parse(message);
      if (data.type === 'prospectUpdated') {
        await this.handleProspectUpdate(data.data.prospectData);
      }
    });

    this.ws.on('error', (error) => {
      logger.error('WebSocket error', error);
    });

    this.ws.on('close', () => {
      logger.log('Disconnected from WebSocket server');
    });
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
    return await prisma.prospect.findUnique({ where: { id: parseInt(prospectId) } });
  }

  async handleProspectUpdate(prospectData) {
    // Implement logic to update the Pre-Call Brief Dashboard with the new prospect data
    // For example, you can regenerate the pre-call brief or update specific fields
    logger.log('Handling prospect update', { prospectData });
    // Add your logic here
  }
}

module.exports = PreCallBriefDashboard;
