import { describe, expect, test } from "bun:test";

import {
  calculateFee,
  formatLocks,
  locksFromIdr,
  parsePositiveInteger,
} from "./money";

describe("money helpers", () => {
  test("formats DL and remaining locks", () => {
    expect(formatLocks(0)).toBe("0 wl");
    expect(formatLocks(100)).toBe("1 dl");
    expect(formatLocks(245)).toBe("2 dl 45 wl");
    expect(formatLocks(10_245)).toBe("1 bgl 2 dl 45 wl");
  });

  test("converts IDR to locks without over-crediting", () => {
    expect(locksFromIdr(10_000, 5_000)).toBe(200);
    expect(locksFromIdr(4_999, 5_000)).toBe(99);
    expect(locksFromIdr(10_000, 0)).toBe(0);
  });

  test("rounds payment fees up", () => {
    expect(calculateFee(10_000, 0.7)).toBe(70);
    expect(calculateFee(10_001, 0.7)).toBe(71);
  });

  test("accepts only strict positive integers", () => {
    expect(parsePositiveInteger(" 12 ")).toBe(12);
    expect(parsePositiveInteger("1.5")).toBeNull();
    expect(parsePositiveInteger("-1")).toBeNull();
    expect(parsePositiveInteger("12abc")).toBeNull();
  });
});
