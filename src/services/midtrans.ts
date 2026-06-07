import type { AppConfig } from "../config";
import { safeEqual, sha512 } from "../lib/security";

export interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_id: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  [key: string]: unknown;
}

export interface MidtransChargeResponse {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  transaction_status: string;
  actions?: Array<{
    name: string;
    method: string;
    url: string;
  }>;
  [key: string]: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requireString(
  record: Record<string, unknown>,
  key: string,
): string {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Payload Midtrans tidak memiliki ${key}`);
  }
  return value;
}

export function parseMidtransNotification(
  value: unknown,
): MidtransNotification {
  if (!isRecord(value)) throw new Error("Payload Midtrans tidak valid");
  return {
    ...value,
    order_id: requireString(value, "order_id"),
    status_code: requireString(value, "status_code"),
    gross_amount: requireString(value, "gross_amount"),
    signature_key: requireString(value, "signature_key"),
    transaction_id: requireString(value, "transaction_id"),
    transaction_status: requireString(value, "transaction_status"),
    fraud_status:
      typeof value.fraud_status === "string" ? value.fraud_status : undefined,
    payment_type:
      typeof value.payment_type === "string" ? value.payment_type : undefined,
  };
}

export class MidtransService {
  private readonly baseUrl: string;
  private readonly authorization: string;

  constructor(private readonly config: AppConfig["midtrans"]) {
    this.baseUrl = config.production
      ? "https://api.midtrans.com"
      : "https://api.sandbox.midtrans.com";
    this.authorization = `Basic ${Buffer.from(`${config.serverKey}:`).toString("base64")}`;
  }

  verifyNotification(notification: MidtransNotification): boolean {
    const expected = sha512(
      `${notification.order_id}${notification.status_code}${notification.gross_amount}${this.config.serverKey}`,
    );
    return safeEqual(expected, notification.signature_key);
  }

  isSuccessful(notification: MidtransNotification): boolean {
    const status = notification.transaction_status.toLowerCase();
    const fraud = notification.fraud_status?.toLowerCase();
    return (
      (status === "settlement" || status === "capture") &&
      (fraud === undefined || fraud === "accept")
    );
  }

  async chargeQris(input: {
    orderId: string;
    grossAmountIdr: number;
    discordId: string;
  }): Promise<{
    transactionId: string;
    orderId: string;
    qrUrl: string;
    raw: MidtransChargeResponse;
  }> {
    this.assertEnabled();
    const response = await this.request<MidtransChargeResponse>("/v2/charge", {
      method: "POST",
      body: JSON.stringify({
        payment_type: "qris",
        transaction_details: {
          order_id: input.orderId,
          gross_amount: input.grossAmountIdr,
        },
        customer_details: {
          first_name: `Discord ${input.discordId}`,
        },
        custom_expiry: {
          expiry_duration: this.config.expiryMinutes,
          unit: "minute",
        },
      }),
    });

    const qrUrl = response.actions?.find(
      (action) => action.name === "generate-qr-code",
    )?.url;
    if (!qrUrl) throw new Error("Midtrans tidak mengembalikan QR Code");

    return {
      transactionId: response.transaction_id,
      orderId: response.order_id,
      qrUrl,
      raw: response,
    };
  }

  async getStatus(orderId: string): Promise<MidtransNotification> {
    this.assertEnabled();
    const response = await this.request<unknown>(
      `/v2/${encodeURIComponent(orderId)}/status`,
      { method: "GET" },
    );
    return parseMidtransNotification(response);
  }

  private assertEnabled(): void {
    if (!this.config.enabled) {
      throw new Error("Pembayaran Midtrans belum diaktifkan");
    }
  }

  private async request<T>(
    path: string,
    init: Pick<RequestInit, "method" | "body">,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: this.authorization,
        "Content-Type": "application/json",
      },
    });

    const payload = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      const message =
        typeof payload.status_message === "string"
          ? payload.status_message
          : `Midtrans HTTP ${response.status}`;
      throw new Error(message);
    }
    return payload as T;
  }
}
