import { timingSafeEqual, createHash } from "crypto";

/**
 * Constant-time secret comparison for the account-activation endpoint — a plain `===` would
 * leak how many leading characters matched via response timing, which matters here since this
 * secret is the only thing standing between an unpaid account and full access.
 */
export function isValidActivationSecret(provided: string, expected: string | undefined): boolean {
  if (!expected) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
