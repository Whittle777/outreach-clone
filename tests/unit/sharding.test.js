const { getShard } = require('../models/Sequence');
const { getShard } = require('../models/SequenceStep');

describe('Sharding Logic', () => {
  it('should return the correct shard for a given bento value', () => {
    expect(getShard(0)).toBe('shard_0');
    expect(getShard(1)).toBe('shard_1');
    expect(getShard(2)).toBe('shard_2');
    expect(getShard(3)).toBe('shard_0');
    expect(getShard(4)).toBe('shard_1');
    expect(getShard(5)).toBe('shard_2');
  });
});
