const SequenceStepShifter = require('../services/sequenceStepShifter');
const { Sequence, SequenceStep } = require('../services/models/Sequence');
const logger = require('../services/logger');

// Mocking dependencies
jest.mock('../services/models/Sequence', () => {
  return {
    findAll: jest.fn(),
  };
});

jest.mock('../services/models/SequenceStep', () => {
  return {
    getSequenceSteps: jest.fn(),
  };
});

jest.mock('../services/logger', () => {
  return {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };
});

describe('SequenceStepShifter', () => {
  let sequenceStepShifter;

  beforeEach(() => {
    sequenceStepShifter = new SequenceStepShifter();
  });

  describe('shiftSequenceSteps', () => {
    it('should shift sequence steps that are due', async () => {
      const sequence1 = { id: 1 };
      const sequence2 = { id: 2 };
      const step1 = { id: 1, isDue: jest.fn().mockReturnValue(true), shift: jest.fn() };
      const step2 = { id: 2, isDue: jest.fn().mockReturnValue(false), shift: jest.fn() };
      const step3 = { id: 3, isDue: jest.fn().mockReturnValue(true), shift: jest.fn() };

      Sequence.findAll.mockResolvedValue([sequence1, sequence2]);
      sequence1.getSequenceSteps.mockResolvedValue([step1, step2]);
      sequence2.getSequenceSteps.mockResolvedValue([step3]);

      await sequenceStepShifter.shiftSequenceSteps();

      expect(step1.isDue).toHaveBeenCalled();
      expect(step1.shift).toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith('Sequence step shifted', { sequenceId: 1, stepId: 1 });

      expect(step2.isDue).toHaveBeenCalled();
      expect(step2.shift).not.toHaveBeenCalled();

      expect(step3.isDue).toHaveBeenCalled();
      expect(step3.shift).toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith('Sequence step shifted', { sequenceId: 2, stepId: 3 });
    });

    it('should log an error if shifting fails', async () => {
      const sequence = { id: 1 };
      const step = { id: 1, isDue: jest.fn().mockReturnValue(true), shift: jest.fn().mockRejectedValue(new Error('Shift failed')) };

      Sequence.findAll.mockResolvedValue([sequence]);
      sequence.getSequenceSteps.mockResolvedValue([step]);

      await sequenceStepShifter.shiftSequenceSteps();

      expect(step.isDue).toHaveBeenCalled();
      expect(step.shift).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Error shifting sequence steps', new Error('Shift failed'));
    });
  });
});
