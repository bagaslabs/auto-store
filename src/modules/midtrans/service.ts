import type { StoreRepository } from "../store/repository";
import {
  type MidtransNotification,
  type MidtransService,
  parseMidtransGrossAmount,
  parseMidtransNotification,
} from "../payments/midtrans";
import type { PaymentNotifier } from "./model";

export class MidtransWebhookService {
  constructor(
    private readonly store: StoreRepository,
    private readonly midtrans: MidtransService,
    private readonly notifyPayment: PaymentNotifier,
  ) {}

  parse(body: unknown): MidtransNotification {
    return parseMidtransNotification(body);
  }

  verify(notification: MidtransNotification): boolean {
    return this.midtrans.verifyNotification(notification);
  }

  isSuccessful(notification: MidtransNotification): boolean {
    return this.midtrans.isSuccessful(notification);
  }

  async settle(notification: MidtransNotification) {
    const result = await this.store.settleTopup({
      orderId: notification.order_id,
      midtransTransactionId: notification.transaction_id,
      transactionStatus: notification.transaction_status,
      grossAmountIdr: parseMidtransGrossAmount(notification.gross_amount),
      payload: notification,
    });

    if (!result.already_credited) {
      await this.notifyPayment(result).catch((error: unknown) => {
        console.error("Gagal mengirim notifikasi pembayaran:", error);
      });
    }

    return {
      ok: true,
      processed: !result.already_credited,
    };
  }
}
