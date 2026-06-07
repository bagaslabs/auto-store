import { createHash, timingSafeEqual } from "node:crypto";

export function sha512(value: string): string {
  return createHash("sha512").update(value, "utf8").digest("hex");
}

export function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
