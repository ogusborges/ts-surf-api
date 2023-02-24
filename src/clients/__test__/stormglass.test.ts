import { StormGlass } from '@src/clients/stormGlass';
import stormGlassWeather3HoursFixture from '@test/fixtures/stormglass_weather_3_hours.json';
import stormGlassWeather3HoursNormalizedFixture from '@test/fixtures/stormglass_weather_3_hours_normalized.json';
import axios from 'axios';

jest.mock('axios');

describe('StormGlass client', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  it('should return the normalized forecast from the StormGlass service', async () => {
    const lat = -33.792726;
    const lng = 151.289824;

    mockedAxios.get.mockResolvedValue({ data: stormGlassWeather3HoursFixture });

    const stormGlass = new StormGlass(mockedAxios);
    const response = await stormGlass.fetchPoints(lat, lng);

    expect(response).toEqual(stormGlassWeather3HoursNormalizedFixture);
  });

  it('should return empty after filtering incomplete forecast point from StormGlass service', async () => {
    const lat = -33.792726;
    const lng = 151.289824;

    mockedAxios.get.mockResolvedValue({
      data: {
        hours: [
          {
            swellDirection: {
              noaa: 64.26,
            },
            windDirection: {
              noaa: 299.45,
            },
          },
        ],
        meta: {
          cost: 1,
          start: '2020-04-26 00:00',
        },
      },
    });

    const stormGlass = new StormGlass(mockedAxios);
    const response = await stormGlass.fetchPoints(lat, lng);

    expect(response).toEqual([]);
  });

  it('should return an StormGlassClientRequestError with Network Error message', async () => {
    const lat = -33.792726;
    const lng = 151.289824;

    mockedAxios.get.mockRejectedValue({ message: 'Network Error' });

    const stormGlass = new StormGlass(mockedAxios);
    const response = stormGlass.fetchPoints(lat, lng);

    expect(response).rejects.toThrow(
      'Unexpected error when querying StormGlass API service: {"message":"Network Error"}'
    );
  });

  it('should return an StormGlassResponseError with rate limit exceed message', async () => {
    const lat = -33.792726;
    const lng = 151.289824;

    mockedAxios.get.mockRejectedValue({
      response: {
        status: 429,
        data: { errors: ['Rate Limit reached.'] },
      },
    });

    const stormGlass = new StormGlass(mockedAxios);
    const response = stormGlass.fetchPoints(lat, lng);

    //await expect(response).rejects.toThrowError(StormGlassClientResponseError);

    await expect(response).rejects.toThrow(
      'Unexpected error returned by the StormGlass API Service: Error {"errors":["Rate Limit reached."]} Code 429'
    );
  });
});
