import { AxiosStatic } from 'axios';

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
      Authorization: 'fake-token',
    };

    const response = await this.request.get<StormGlassAPIResponse>(
      'https://api.stormglass.io/v2/weather/point',
      {
        params,
        headers,
      }
    );

    return this.normalizeResponse(response.data);
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
