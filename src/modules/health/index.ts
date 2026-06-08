import { Elysia } from "elysia";

import type { AppConfig } from "../../shared/config";
import { HealthService } from "./service";

export function createHealthModule(config: AppConfig) {
  const service = new HealthService(config);

  return new Elysia({ name: "Health.Module" })
    .get("/", () => service.root())
    .get("/health", () => service.health());
}
