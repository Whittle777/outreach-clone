const GeolocationService = require('../services/geolocationService');
const axios = require('axios');

jest.mock('axios');

describe('GeolocationService', () => {
  let geolocationService;

  beforeEach(() => {
    geolocationService = new GeolocationService('your-api-key');
  });

  test('should return the correct region for a given country', async () => {
    const mockResponse = {
      data: {
        country_name: 'United States',
        region_name: 'California',
      },
    };

    axios.get.mockResolvedValue(mockResponse);

    const region = await geolocationService.getRegionByCountry('US');
    expect(region).toBe('California');
  });

  test('should handle errors when fetching geolocation data', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'));

    await expect(geolocationService.getRegionByCountry('US')).rejects.toThrow('Network Error');
  });
});
