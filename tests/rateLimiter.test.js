const { voiceCallLimiter } = require('../services/rateLimiter');
const { RateLimiter } = require('../services/rateLimiter');
const sinon = require('sinon');
const redis = require('ioredis');

describe('RateLimiter', () => {
  let rateLimiter;
  let redisGetStub;
  let redisIncrStub;
  let redisExpireStub;
  let doubleWriteStrategyWriteStub;
  let loggerLogStub;
  let loggerErrorStub;

  beforeEach(() => {
    rateLimiter = new RateLimiter(10, 60);
    redisGetStub = sinon.stub(redis, 'get');
    redisIncrStub = sinon.stub(redis, 'incr');
    redisExpireStub = sinon.stub(redis, 'expire');
    doubleWriteStrategyWriteStub = sinon.stub(doubleWriteStrategy, 'write');
    loggerLogStub = sinon.stub(logger, 'log');
    loggerErrorStub = sinon.stub(logger, 'error');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('isRateLimited', () => {
    it('should return false if count is less than limit', async () => {
      redisGetStub.resolves(5);
      const result = await rateLimiter.isRateLimited('call:123');
      expect(result).to.be.false;
      expect(redisGetStub.calledOnceWith('call:123')).to.be.true;
    });

    it('should return true if count is equal to limit', async () => {
      redisGetStub.resolves(10);
      const result = await rateLimiter.isRateLimited('call:123');
      expect(result).to.be.true;
      expect(redisGetStub.calledOnceWith('call:123')).to.be.true;
      expect(loggerLogStub.calledOnceWith('Rate limit hit', { key: 'call:123', count: 10, limit: 10 })).to.be.true;
    });

    it('should return true if count is greater than limit', async () => {
      redisGetStub.resolves(15);
      const result = await rateLimiter.isRateLimited('call:123');
      expect(result).to.be.true;
      expect(redisGetStub.calledOnceWith('call:123')).to.be.true;
      expect(loggerLogStub.calledOnceWith('Rate limit hit', { key: 'call:123', count: 15, limit: 10 })).to.be.true;
    });
  });

  describe('incrementRequestCount', () => {
    it('should increment count and set expiration if count is 1', async () => {
      redisGetStub.resolves(null);
      redisIncrStub.resolves(1);
      await rateLimiter.incrementRequestCount('call:123');
      expect(redisIncrStub.calledOnceWith('call:123')).to.be.true;
      expect(redisExpireStub.calledOnceWith('call:123', 60)).to.be.true;
      expect(doubleWriteStrategyWriteStub.calledOnceWith({ key: 'call:123', count: 1 })).to.be.true;
      expect(loggerLogStub.calledOnceWith('Request count incremented', { key: 'call:123', count: 1 })).to.be.true;
    });

    it('should increment count without setting expiration if count is greater than 1', async () => {
      redisGetStub.resolves(5);
      redisIncrStub.resolves(6);
      await rateLimiter.incrementRequestCount('call:123');
      expect(redisIncrStub.calledOnceWith('call:123')).to.be.true;
      expect(redisExpireStub.notCalled).to.be.true;
      expect(doubleWriteStrategyWriteStub.calledOnceWith({ key: 'call:123', count: 6 })).to.be.true;
      expect(loggerLogStub.calledOnceWith('Request count incremented', { key: 'call:123', count: 6 })).to.be.true;
    });
  });
});
