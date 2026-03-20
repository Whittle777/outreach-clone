const { Sequence } = require('./models/Sequence');
const { SequenceStep } = require('./models/SequenceStep');
const logger = require('./logger');

class SequenceStepShifter {
  constructor() {
    this.config = require('./config').getConfig();
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
          }
        }
      }
    } catch (error) {
      logger.error('Error shifting sequence steps', error);
    }
  }
}

module.exports = SequenceStepShifter;
