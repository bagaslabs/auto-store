import type { AppConfig } from "../../shared/config";

export class HealthService {
  constructor(private readonly config: AppConfig) {}

  root() {
    return {
      service: this.config.storeName,
      status: "ok",
    };
  }

  health() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }
}
