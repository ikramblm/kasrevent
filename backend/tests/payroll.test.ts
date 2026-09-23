import { describe, expect, it } from "vitest";
import { isMonthlyPayrollDue } from "../src/modules/employes/payroll";

describe("isMonthlyPayrollDue", () => {
  it("is due when today matches jourDePaie and never paid before", () => {
    const today = new Date("2026-03-15T10:00:00Z");
    expect(isMonthlyPayrollDue({ jourDePaie: 15, derniereDatePaie: null, today })).toBe(true);
  });

  it("is not due when today does not match jourDePaie", () => {
    const today = new Date("2026-03-14T10:00:00Z");
    expect(isMonthlyPayrollDue({ jourDePaie: 15, derniereDatePaie: null, today })).toBe(false);
  });

  it("is not due when already paid this month", () => {
    const today = new Date("2026-03-15T10:00:00Z");
    const derniereDatePaie = new Date("2026-03-15T09:00:00Z");
    expect(isMonthlyPayrollDue({ jourDePaie: 15, derniereDatePaie, today })).toBe(false);
  });

  it("is due again once a new month starts", () => {
    const today = new Date("2026-04-15T10:00:00Z");
    const derniereDatePaie = new Date("2026-03-15T09:00:00Z");
    expect(isMonthlyPayrollDue({ jourDePaie: 15, derniereDatePaie, today })).toBe(true);
  });
});
