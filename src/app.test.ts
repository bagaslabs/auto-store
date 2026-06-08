import { describe, expect, test } from "bun:test";

import { createApp } from "./app";
import type { AppConfig } from "./shared/config";
import type { MidtransService } from "./modules/payments/midtrans";
import type { StoreRepository } from "./modules/store/repository";

const config: AppConfig = {
  host: "0.0.0.0",
  port: 3000,
  storeName: "Wilcraft Store",
  discord: {
    token: "token",
    clientId: "client",
    liveStockChannelId: "channel",
    adminRoleIds: [],
    purchaseRoleIds: [],
  },
  supabase: {
    url: "https://example.supabase.co",
    serviceRoleKey: "service-role",
  },
  midtrans: {
    serverKey: "",
    enabled: false,
    production: false,
    feePercent: 0.7,
    expiryMinutes: 10,
  },
  topup: {
    minimumIdr: 10_000,
    maximumIdr: 10_000_000,
  },
  growtopia: {
    depositToken: "test-token",
    enabled: true,
  },
};

const app = createApp({
  config,
  store: {} as StoreRepository,
  midtrans: {} as MidtransService,
  notifyPayment: async () => {},
});

describe("createApp", () => {
  test("serves root service metadata", async () => {
    const response = await app.handle(new Request("http://localhost/"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      service: "Wilcraft Store",
      status: "ok",
    });
  });

  test("serves health check", async () => {
    const response = await app.handle(new Request("http://localhost/health"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(typeof body.timestamp).toBe("string");
  });

  test("rejects Midtrans webhook when disabled", async () => {
    const response = await app.handle(
      new Request("http://localhost/webhooks/midtrans", {
        method: "POST",
        body: "{}",
      }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      ok: false,
      error: "Midtrans belum diaktifkan",
    });
  });
});
