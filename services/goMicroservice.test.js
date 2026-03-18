// services/goMicroservice.test.js

const axios = require('axios');
const { callGoMicroservice } = require('./goMicroservice');

jest.mock('axios');

describe('callGoMicroservice', () => {
  it('should return true if the Go microservice allows the request', async () => {
    axios.post.mockResolvedValue({ data: { isAllowed: true } });

    const result = await callGoMicroservice('123', 'default');
    expect(result).toBe(true);
  });

  it('should return false if the Go microservice does not allow the request', async () => {
    axios.post.mockResolvedValue({ data: { isAllowed: false } });

    const result = await callGoMicroservice('123', 'default');
    expect(result).toBe(false);
  });

  it('should throw an error if the Go microservice call fails', async () => {
    axios.post.mockRejectedValue(new Error('Network error'));

    await expect(callGoMicroservice('123', 'default')).rejects.toThrow('Failed to communicate with Go microservice');
  });
});
