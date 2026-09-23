import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../src/utils/password";

describe("password hashing", () => {
  it("hashes a password and verifies the correct plaintext", async () => {
    const hash = await hashPassword("Sup3rSecret!");
    expect(hash).not.toBe("Sup3rSecret!");
    await expect(verifyPassword("Sup3rSecret!", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect plaintext", async () => {
    const hash = await hashPassword("Sup3rSecret!");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
});
