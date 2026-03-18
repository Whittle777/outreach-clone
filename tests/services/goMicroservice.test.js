const axios = require('axios');
const { callGoMicroservice } = require('../services/goMicroservice');

jest.mock('axios');

describe('callGoMicroservice', () => {
  it('should return true if the Go microservice allows the request', async () => {
    const prospectId = '123';
    const bento = 'default';
    const mockResponse = { data: { isAllowed: true } };

    axios.post.mockResolvedValue(mockResponse);

    const result = await callGoMicroservice(prospectId, bento);

    expect(axios.post).toHaveBeenCalledWith('http://go-microservice/rate-limit', {
      prospectId,
      bento,
    });
    expect(result).toBe(true);
  });

  it('should return false if the Go microservice does not allow the request', async () => {
    const prospectId = '123';
    const bento = 'default';
    const mockResponse = { data: { isAllowed: false } };

    axios.post.mockResolvedValue(mockResponse);

    const result = await callGoMicroservice(prospectId, bento);

    expect(axios.post).toHaveBeenCalledWith('http://go-microservice/rate-limit', {
      prospectId,
      bento,
    });
    expect(result).toBe(false);
  });

  it('should throw an error if the Go microservice call fails', async () => {
    const prospectId = '123';
    const bento = 'default';
    const mockError = new Error('Network Error');

    axios.post.mockRejectedValue(mockError);

    await expect(callGoMicroservice(prospectId, bento)).rejects.toThrow('Failed to communicate with Go microservice');
  });
});
