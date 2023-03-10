import './util/module-alias';

import { Server } from '@overnightjs/core';
import { json, Application } from 'express';
import ForecastController from './controllers/forecast';

export class SetupServer extends Server {
  constructor(private port: number = 3000) {
    super();
  }

  public init(): void {
    this.setupExpress();
    this.setupControllers();
  }

  private setupExpress(): void {
    this.app.use(json());
  }

  private setupControllers(): void {
    const forecastController = new ForecastController();
    this.addControllers([forecastController]);
  }

  public getApp(): Application {
    return this.app;
  }
}
