import { describe, expect, it } from "vitest";
import { signToken, verifyToken } from "../src/utils/jwt";

describe("jwt", () => {
  it("round-trips a signed payload", () => {
    const token = signToken({ sub: "user-1", role: "ADMIN", email: "a@b.com" });
    const decoded = verifyToken(token);
    expect(decoded.sub).toBe("user-1");
    expect(decoded.role).toBe("ADMIN");
  });

  it("rejects a tampered token", () => {
    const token = signToken({ sub: "user-1", role: "USER", email: null });
    expect(() => verifyToken(token + "tampered")).toThrow();
  });
});
