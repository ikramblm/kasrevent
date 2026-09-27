import { describe, expect, it } from "vitest";
import { isValidActivationSecret } from "../src/utils/activation";

describe("isValidActivationSecret", () => {
  it("accepts a matching secret", () => {
    expect(isValidActivationSecret("correct-horse", "correct-horse")).toBe(true);
  });

  it("rejects a wrong secret", () => {
    expect(isValidActivationSecret("wrong", "correct-horse")).toBe(false);
  });

  it("rejects any secret when none is configured for this deployment", () => {
    expect(isValidActivationSecret("anything", undefined)).toBe(false);
  });

  it("rejects secrets of different lengths without throwing", () => {
    expect(isValidActivationSecret("short", "a-much-longer-secret-value")).toBe(false);
  });
});
