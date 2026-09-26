import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { errorHandler } from "../src/middleware/errors";

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function prismaError(code: string, meta?: Record<string, unknown>) {
  return new Prisma.PrismaClientKnownRequestError("boom", { code, clientVersion: "5.22.0", meta });
}

describe("errorHandler — Prisma error mapping", () => {
  // Found during the functional audit: deleting a Client with existing Reservations, or
  // creating a User with a duplicate email, previously fell through to a bare 500 with no
  // indication of what actually went wrong.

  it("maps P2002 (unique constraint) to a 409 with a specific message", () => {
    const res = mockRes();
    errorHandler(prismaError("P2002", { target: ["email"] }), {} as any, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining("email") }));
  });

  it("maps P2003 (foreign key constraint) to a 409 explaining the record is referenced", () => {
    const res = mockRes();
    errorHandler(prismaError("P2003"), {} as any, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining("referenced") }));
  });

  it("maps P2025 (record not found) to a 404", () => {
    const res = mockRes();
    errorHandler(prismaError("P2025"), {} as any, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  // Found live in production: deleting a Client with an existing Reservation raises the FK
  // violation at the Postgres level (RESTRICT), which Prisma surfaces as an "unknown"
  // request error rather than the P2003/P2014 codes above — must be caught separately.
  it("maps a RESTRICT foreign-key violation (PrismaClientUnknownRequestError) to a 409", () => {
    const res = mockRes();
    const err = new Prisma.PrismaClientUnknownRequestError(
      'Invalid `prisma.client.delete()` invocation:\n\nError occurred during query execution:\nConnectorError(ConnectorError { user_facing_error: None, kind: QueryError(PostgresError { code: "23001", message: "update or delete on table \\"clients\\" violates RESTRICT setting of foreign key constraint \\"reservations_clientId_fkey\\" on table \\"reservations\\"", severity: "ERROR", detail: Some("Key (id)=(1f9c708e-23d2-4bf9-8c15-41bf289c004e) is referenced from table \\"reservations\\"."), column: None, hint: None }), transient: false })',
      { clientVersion: "5.22.0" }
    );
    errorHandler(err, {} as any, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining("referenced") }));
  });

  it("falls back to 500 for an unrecognized Prisma error code", () => {
    const res = mockRes();
    errorHandler(prismaError("P9999"), {} as any, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
