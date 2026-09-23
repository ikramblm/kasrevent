import { describe, expect, it, vi, beforeEach } from "vitest";

const findFirst = vi.fn();

vi.mock("../src/utils/prisma", () => ({
  prisma: {
    reservation: { findFirst: (...args: unknown[]) => findFirst(...args) }
  }
}));

// Imported after the mock so it picks up the mocked module.
const { assertRoomAvailable } = await import("../src/modules/reservations/reservations.service");

describe("assertRoomAvailable", () => {
  beforeEach(() => {
    findFirst.mockReset();
  });

  it("resolves when no overlapping reservation exists", async () => {
    findFirst.mockResolvedValue(null);
    await expect(
      assertRoomAvailable({ salleId: "salle-1", dateDebut: new Date("2026-07-01"), dateFin: new Date("2026-07-02") })
    ).resolves.toBeUndefined();
  });

  it("throws a 409 conflict when another reservation overlaps the same room", async () => {
    findFirst.mockResolvedValue({ id: "res-existing", client: { nom: "Existing Client" } });
    await expect(
      assertRoomAvailable({ salleId: "salle-1", dateDebut: new Date("2026-07-01"), dateFin: new Date("2026-07-02") })
    ).rejects.toMatchObject({ status: 409 });
  });

  it("rejects an inverted date range before even querying the database", async () => {
    await expect(
      assertRoomAvailable({ salleId: "salle-1", dateDebut: new Date("2026-07-05"), dateFin: new Date("2026-07-01") })
    ).rejects.toMatchObject({ status: 400 });
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("excludes the reservation's own id from the overlap check when updating", async () => {
    findFirst.mockResolvedValue(null);
    await assertRoomAvailable({
      salleId: "salle-1",
      dateDebut: new Date("2026-07-01"),
      dateFin: new Date("2026-07-02"),
      excludeReservationId: "res-self"
    });
    const whereArg = findFirst.mock.calls[0][0].where;
    expect(whereArg.id).toEqual({ not: "res-self" });
  });
});
