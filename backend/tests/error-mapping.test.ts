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

  it("falls back to 500 for an unrecognized Prisma error code", () => {
    const res = mockRes();
    errorHandler(prismaError("P9999"), {} as any, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
