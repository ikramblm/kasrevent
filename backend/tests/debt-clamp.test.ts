import { describe, expect, it } from "vitest";
import { clamp } from "../src/modules/charges/charges.service";

describe("clamp (debt/amount-owed floor)", () => {
  it("subtracts normally when the payment doesn't exceed the balance", () => {
    expect(clamp(10000, 4000)).toBe(6000);
  });

  it("never goes negative when the payment exceeds the current balance", () => {
    expect(clamp(0, 10000)).toBe(0);
    expect(clamp(5000, 8000)).toBe(0);
  });

  it("accepts a Prisma Decimal-like value (anything Number() can coerce)", () => {
    const decimalLike = { toString: () => "7500" } as unknown as number;
    expect(clamp(decimalLike, 2000)).toBe(5500);
  });
});
