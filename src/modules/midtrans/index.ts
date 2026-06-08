import { Elysia } from "elysia";

import type { AppConfig } from "../../shared/config";
import type { MidtransService } from "../payments/midtrans";
import type { StoreRepository } from "../store/repository";
import type { PaymentNotifier } from "./model";
import { MidtransWebhookService } from "./service";

export function createMidtransModule(input: {
  config: AppConfig;
  store: StoreRepository;
  midtrans: MidtransService;
  notifyPayment: PaymentNotifier;
}) {
  const service = new MidtransWebhookService(
    input.store,
    input.midtrans,
    input.notifyPayment,
  );

  return new Elysia({ name: "Midtrans.Module" }).post(
    "/webhooks/midtrans",
    async ({ body, set }) => {
      if (!input.config.midtrans.enabled) {
        set.status = 503;
        return { ok: false, error: "Midtrans belum diaktifkan" };
      }

      let notification;
      try {
        notification = service.parse(body);
      } catch (error) {
        set.status = 400;
        return {
          ok: false,
          error: error instanceof Error ? error.message : "Payload tidak valid",
        };
      }

      if (!service.verify(notification)) {
        set.status = 401;
        return { ok: false, error: "Signature tidak valid" };
      }

      if (!service.isSuccessful(notification)) {
        return {
          ok: true,
          processed: false,
          status: notification.transaction_status,
        };
      }

      try {
        return await service.settle(notification);
      } catch (error) {
        console.error("Gagal memproses webhook Midtrans:", error);
        set.status = 500;
        return { ok: false, error: "Webhook gagal diproses" };
      }
    },
  );
}
