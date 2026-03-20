const { Sequence } = require('./models/Sequence');
const { SequenceStep } = require('./models/SequenceStep');
const logger = require('./logger');
const rabbitmqService = require('../rabbitmq/rabbitmqService');

class SequenceStepShifter {
  constructor() {
    this.config = require('./config').getConfig();
    this.rabbitmqService = new rabbitmqService(this.config.rabbitmq);
  }

  async shiftSequenceSteps() {
    try {
      const sequences = await Sequence.findAll();
      for (const sequence of sequences) {
        const steps = await sequence.getSequenceSteps();
        for (const step of steps) {
          if (step.isDue()) {
            await step.shift();
            logger.log('Sequence step shifted', { sequenceId: sequence.id, stepId: step.id });

            // Check if the step requires an Azure ACS voicemail drop
            if (step.requiresAzureAcsVoicemailDrop) {
              const prospectData = step.getProspectData();
              const audioFileUrl = step.getAudioFileUrl();
              const onBehalfOf = step.getOnBehalfOf(); // Add this line

              // Validate caller ID display in Teams
              const isCallerIdValid = await this.rabbitmqService.validateCallerIdDisplay(prospectData, onBehalfOf);
              if (isCallerIdValid) {
                await this.rabbitmqService.initiateAzureAcsVoicemailDrop(prospectData, audioFileUrl, onBehalfOf);
              } else {
                logger.error('Caller ID display validation failed', { prospectData, onBehalfOf });
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error shifting sequence steps', error);
    }
  }
}

module.exports = SequenceStepShifter;
