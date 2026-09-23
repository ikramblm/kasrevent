import { describe, expect, it } from "vitest";
import { computeAccessStatus } from "../src/modules/checkin/access-window";

describe("computeAccessStatus", () => {
  const dateDebut = new Date("2026-06-01T00:00:00Z");
  const dateFin = new Date("2026-06-03T23:59:59Z");

  it("is VALIDE within the reservation window", () => {
    const now = new Date("2026-06-02T12:00:00Z");
    expect(computeAccessStatus({ dateDebut, dateFin, now })).toBe("VALIDE");
  });

  it("is EXPIRE before the window starts", () => {
    const now = new Date("2026-05-30T12:00:00Z");
    expect(computeAccessStatus({ dateDebut, dateFin, now })).toBe("EXPIRE");
  });

  it("is EXPIRE after the window ends", () => {
    const now = new Date("2026-06-10T12:00:00Z");
    expect(computeAccessStatus({ dateDebut, dateFin, now })).toBe("EXPIRE");
  });
});
