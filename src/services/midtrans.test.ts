import { describe, expect, test } from "bun:test";

import { sha512 } from "../lib/security";
import {
  MidtransService,
  parseMidtransGrossAmount,
  parseMidtransNotification,
} from "./midtrans";

const serverKey = "SB-Mid-server-test";
const service = new MidtransService({
  serverKey,
  enabled: true,
  production: false,
  feePercent: 0.7,
  expiryMinutes: 10,
});

function notification(status = "settlement") {
  const orderId = "OST-123";
  const statusCode = "200";
  const grossAmount = "10070.00";
  return {
    order_id: orderId,
    status_code: statusCode,
    gross_amount: grossAmount,
    transaction_id: "midtrans-123",
    transaction_status: status,
    fraud_status: "accept",
    signature_key: sha512(
      `${orderId}${statusCode}${grossAmount}${serverKey}`,
    ),
  };
}

describe("MidtransService", () => {
  test("parses and verifies a valid notification", () => {
    const parsed = parseMidtransNotification(notification());
    expect(service.verifyNotification(parsed)).toBe(true);
    expect(service.isSuccessful(parsed)).toBe(true);
  });

  test("rejects a modified signature", () => {
    const parsed = parseMidtransNotification({
      ...notification(),
      gross_amount: "99999.00",
    });
    expect(service.verifyNotification(parsed)).toBe(false);
  });

  test("does not treat pending payments as successful", () => {
    const parsed = parseMidtransNotification(notification("pending"));
    expect(service.isSuccessful(parsed)).toBe(false);
  });

  test("rejects incomplete payloads", () => {
    expect(() => parseMidtransNotification({ order_id: "x" })).toThrow();
  });

  test("parses Midtrans decimal-formatted IDR amount", () => {
    expect(parseMidtransGrossAmount("223778.00")).toBe(223778);
  });

  test("rejects fractional Midtrans IDR amount", () => {
    expect(() => parseMidtransGrossAmount("223778.50")).toThrow();
  });
});
