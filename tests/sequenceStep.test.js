const { createSequenceStep, getSequenceStepsBySequenceId, updateSequenceStep, deleteSequenceStep } = require('../models/SequenceStep');
const { getShard } = require('../models/SequenceStep');

describe('SequenceStep Model', () => {
  let testBento = 1;
  let testSequenceId;
  let testSequenceStepId;

  beforeEach(async () => {
    const sequence = await createSequence(1, 'Test Sequence', testBento, 'testTag');
    testSequenceId = sequence.id;
    const sequenceStep = await createSequenceStep(testSequenceId, 1, 0, 'Test Subject', 'Test Body', testBento, 'testTag');
    testSequenceStepId = sequenceStep.id;
  });

  afterEach(async () => {
    await deleteSequenceStep(testSequenceStepId, testBento);
    await deleteSequence(testSequenceId, testBento);
  });

  it('should create a sequence step with a schema tag', async () => {
    const sequenceSteps = await getSequenceStepsBySequenceId(testSequenceId, testBento);
    expect(sequenceSteps[0].schemaTag).toBe('testTag');
  });

  it('should update the schema tag of a sequence step', async () => {
    await updateSequenceStep(testSequenceStepId, 1, 0, 'Updated Subject', 'Updated Body', testBento, 'updatedTag');
    const updatedSequenceStep = await getSequenceStepsBySequenceId(testSequenceId, testBento);
    expect(updatedSequenceStep[0].schemaTag).toBe('updatedTag');
  });
});
