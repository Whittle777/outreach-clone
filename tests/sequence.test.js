const { createSequence, getSequenceById, updateSequence, deleteSequence } = require('../models/Sequence');
const { getShard } = require('../models/Sequence');

describe('Sequence Model', () => {
  let testBento = 1;
  let testSequenceId;

  beforeEach(async () => {
    const sequence = await createSequence(1, 'Test Sequence', testBento, 'testTag');
    testSequenceId = sequence.id;
  });

  afterEach(async () => {
    await deleteSequence(testSequenceId, testBento);
  });

  it('should create a sequence with a schema tag', async () => {
    const sequence = await getSequenceById(testSequenceId, testBento);
    expect(sequence.schemaTag).toBe('testTag');
  });

  it('should update the schema tag of a sequence', async () => {
    await updateSequence(testSequenceId, 'Updated Sequence', testBento, 'updatedTag');
    const updatedSequence = await getSequenceById(testSequenceId, testBento);
    expect(updatedSequence.schemaTag).toBe('updatedTag');
  });
});
