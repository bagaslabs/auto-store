import { Elysia } from "elysia";

import type { AppConfig } from "./config";
import type { StoreRepository } from "./repositories/store";
import {
  type MidtransNotification,
  MidtransService,
  parseMidtransGrossAmount,
  parseMidtransNotification,
} from "./services/midtrans";
import type { SettlementResult } from "./types";

export interface PaymentNotifier {
  (result: SettlementResult): Promise<void>;
}

export function createServer(input: {
  config: AppConfig;
  store: StoreRepository;
  midtrans: MidtransService;
  notifyPayment: PaymentNotifier;
}) {
  return new Elysia()
    .get("/", () => ({
      service: input.config.storeName,
      status: "ok",
    }))
    .get("/health", () => ({
      status: "ok",
      timestamp: new Date().toISOString(),
    }))
    .post("/webhooks/midtrans", async ({ body, set }) => {
      if (!input.config.midtrans.enabled) {
        set.status = 503;
        return { ok: false, error: "Midtrans belum diaktifkan" };
      }

      let notification: MidtransNotification;
      try {
        notification = parseMidtransNotification(body);
      } catch (error) {
        set.status = 400;
        return {
          ok: false,
          error: error instanceof Error ? error.message : "Payload tidak valid",
        };
      }

      if (!input.midtrans.verifyNotification(notification)) {
        set.status = 401;
        return { ok: false, error: "Signature tidak valid" };
      }

      if (!input.midtrans.isSuccessful(notification)) {
        return {
          ok: true,
          processed: false,
          status: notification.transaction_status,
        };
      }

      try {
        const result = await input.store.settleTopup({
          orderId: notification.order_id,
          midtransTransactionId: notification.transaction_id,
          transactionStatus: notification.transaction_status,
          grossAmountIdr: parseMidtransGrossAmount(
            notification.gross_amount,
          ),
          payload: notification,
        });

        if (!result.already_credited) {
          await input.notifyPayment(result).catch((error: unknown) => {
            console.error("Gagal mengirim notifikasi pembayaran:", error);
          });
        }

        return {
          ok: true,
          processed: !result.already_credited,
        };
      } catch (error) {
        console.error("Gagal memproses webhook Midtrans:", error);
        set.status = 500;
        return { ok: false, error: "Webhook gagal diproses" };
      }
    });
}
