const rateLimitingService = require('./rateLimitingService');

jest.mock('redis');

describe('rateLimitingService', () => {
  let client;

  beforeEach(() => {
    client = require('redis').createClient();
    client.get.mockResolvedValue(null);
    client.multi.mockReturnValue({
      incr: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([null, 1]),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAndIncrementThrottle', () => {
    it('should return false if the limit is exceeded', async () => {
      client.get.mockResolvedValue('1000');
      const result = await rateLimitingService.checkAndIncrementThrottle('key', 1000, 86400);
      expect(result).toBe(false);
    });

    it('should return true and increment the throttle if the limit is not exceeded', async () => {
      const result = await rateLimitingService.checkAndIncrementThrottle('key', 1000, 86400);
      expect(result).toBe(true);
      expect(client.multi).toHaveBeenCalled();
      expect(client.multi().incr).toHaveBeenCalledWith('key');
      expect(client.multi().expire).toHaveBeenCalledWith('key', 86400);
      expect(client.multi().exec).toHaveBeenCalled();
    });
  });

  describe('throttleRequest', () => {
    it('should return false if any throttle limit is exceeded', async () => {
      client.get.mockResolvedValue('1000');
      const result = await rateLimitingService.throttleRequest('user1', 'org1', 'prospect1', 'domain.com', 'action');
      expect(result).toBe(false);
    });

    it('should return true if all throttle limits are not exceeded', async () => {
      const result = await rateLimitingService.throttleRequest('user1', 'org1', 'prospect1', 'domain.com', 'action');
      expect(result).toBe(true);
      expect(client.multi).toHaveBeenCalledTimes(4);
      expect(client.multi().incr).toHaveBeenCalledWith('throttle:user:user1:action');
      expect(client.multi().expire).toHaveBeenCalledWith('throttle:user:user1:action', 86400);
      expect(client.multi().incr).toHaveBeenCalledWith('throttle:organization:org1:action');
      expect(client.multi().expire).toHaveBeenCalledWith('throttle:organization:org1:action', 86400);
      expect(client.multi().incr).toHaveBeenCalledWith('throttle:prospect:prospect1:action');
      expect(client.multi().expire).toHaveBeenCalledWith('throttle:prospect:prospect1:action', 86400);
      expect(client.multi().incr).toHaveBeenCalledWith('throttle:domain:domain.com:action');
      expect(client.multi().expire).toHaveBeenCalledWith('throttle:domain:domain.com:action', 86400);
      expect(client.multi().exec).toHaveBeenCalledTimes(4);
    });
  });
});
