import { AxiosStatic, AxiosError, isAxiosError } from 'axios';
import { InternalError } from '@src/util/errors/internalError';
import config from 'config';

interface StormGlassResourceConfig {
  readonly apiUrl: string;
  readonly apiToken: string;
}

const stormGlassResourceConfig = config.get<StormGlassResourceConfig>(
  'App.resources.StormGlass'
);

export interface StormGlassPointSource {
  [key: string]: number;
}

export interface StormGlassPoint {
  readonly time: string;
  readonly swellDirection: StormGlassPointSource;
  readonly swellHeight: StormGlassPointSource;
  readonly swellPeriod: StormGlassPointSource;
  readonly waveDirection: StormGlassPointSource;
  readonly waveHeight: StormGlassPointSource;
  readonly windDirection: StormGlassPointSource;
  readonly windSpeed: StormGlassPointSource;
}

export interface StormGlassAPIResponse {
  hours: Array<StormGlassPoint>;
}

export interface ForecastPoint {
  readonly time: string;
  readonly swellDirection: number;
  readonly swellHeight: number;
  readonly swellPeriod: number;
  readonly waveDirection: number;
  readonly waveHeight: number;
  readonly windDirection: number;
  readonly windSpeed: number;
}

export class StormGlassClientRequestError extends InternalError {
  constructor(message: string) {
    const internalMessage =
      'Unexpected error when querying StormGlass API service';

    super(`${internalMessage}: ${message}`);
  }
}

export class StormGlassClientResponseError extends InternalError {
  constructor(message: string) {
    const internalMessage =
      'Unexpected error returned by the StormGlass API Service';

    super(`${internalMessage}: ${message}`);
  }
}

export class StormGlass {
  readonly stormGlassAPIParams: string =
    'swellDirection,swellHeight,swellPeriod,waveDirection,waveHeight,windDirection,windSpeed';
  readonly stormGlassAPISource: string = 'noaa';

  constructor(protected request: AxiosStatic) {}

  public async fetchPoints(
    lat: number,
    lng: number
  ): Promise<Array<ForecastPoint>> {
    const params = {
      params: this.stormGlassAPIParams,
      source: this.stormGlassAPISource,
      end: 15921138026,
      lat: lat,
      lng: lng,
    };

    const headers = {
      Authorization: stormGlassResourceConfig.apiToken,
    };

    try {
      const response = await this.request.get<StormGlassAPIResponse>(
        `${stormGlassResourceConfig.apiUrl}/weather/point`,
        {
          params,
          headers,
        }
      );

      return this.normalizeResponse(response.data);
    } catch (err) {
      if (err instanceof Error) {
        
        if (err?.response?.status) {
          throw new StormGlassClientResponseError(
            `Error ${JSON.stringify(err.response.data)} Code ${
              err.response.status
            }`
          );
        }

        throw new StormGlassClientRequestError(err.message);
      }

      throw new StormGlassClientRequestError(JSON.stringify(err));
    }
  }

  private normalizePoint(point: StormGlassPoint): ForecastPoint {
    return {
      time: point.time,
      swellDirection: point.swellDirection[this.stormGlassAPISource],
      swellHeight: point.swellHeight[this.stormGlassAPISource],
      swellPeriod: point.swellPeriod[this.stormGlassAPISource],
      waveDirection: point.waveDirection[this.stormGlassAPISource],
      waveHeight: point.waveHeight[this.stormGlassAPISource],
      windDirection: point.windDirection[this.stormGlassAPISource],
      windSpeed: point.windSpeed[this.stormGlassAPISource],
    };
  }

  private normalizeResponse(
    points: StormGlassAPIResponse
  ): Array<ForecastPoint> {
    return points.hours
      .filter(this.isValidPoint.bind(this))
      .map(this.normalizePoint.bind(this));
  }

  private isValidPoint(point: Partial<StormGlassPoint>): boolean {
    return !!(
      point.time &&
      point.swellDirection?.[this.stormGlassAPISource] &&
      point.swellHeight?.[this.stormGlassAPISource] &&
      point.swellPeriod?.[this.stormGlassAPISource] &&
      point.waveDirection?.[this.stormGlassAPISource] &&
      point.waveHeight?.[this.stormGlassAPISource] &&
      point.windDirection?.[this.stormGlassAPISource] &&
      point.windSpeed?.[this.stormGlassAPISource]
    );
  }
}
