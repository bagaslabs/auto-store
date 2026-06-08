import { Elysia } from "elysia";

import type { AppConfig } from "./shared/config";
import { createGrowtopiaModule } from "./modules/growtopia";
import { createHealthModule } from "./modules/health";
import { createMidtransModule } from "./modules/midtrans";
import type { MidtransService } from "./modules/payments/midtrans";
import type { StoreRepository } from "./modules/store/repository";
import type { PaymentNotifier } from "./modules/midtrans/model";

export function createApp(input: {
  config: AppConfig;
  store: StoreRepository;
  midtrans: MidtransService;
  notifyPayment: PaymentNotifier;
}) {
  return new Elysia({ name: "AutoStore.App" })
    .use(createHealthModule(input.config))
    .use(createMidtransModule(input))
    .use(createGrowtopiaModule(input));
}
