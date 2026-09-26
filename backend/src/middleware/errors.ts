import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }
  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }
  static notFound(message = "Not found") {
    return new ApiError(404, message);
  }
  static conflict(message: string, details?: unknown) {
    return new ApiError(409, message, details);
  }
}

/**
 * Maps Prisma's known request errors to clean, specific HTTP responses instead of an
 * opaque 500 — e.g. deleting a Client that still has Reservations, or creating a User
 * with an email that's already taken, previously surfaced as "Internal server error"
 * with no indication of what actually went wrong (found during the functional audit).
 */
function mapPrismaError(err: Prisma.PrismaClientKnownRequestError): ApiError | null {
  const target = Array.isArray(err.meta?.target) ? (err.meta!.target as string[]).join(", ") : err.meta?.target;
  switch (err.code) {
    case "P2002":
      return ApiError.conflict(`A record with this ${target ?? "value"} already exists.`);
    case "P2003":
    case "P2014":
      return ApiError.conflict(
        "This record is still referenced by other data (e.g. a reservation, charge, or history entry) and cannot be deleted or changed this way."
      );
    case "P2025":
      return ApiError.notFound("Record not found.");
    default:
      return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, details: err.details ?? null });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(err);
    if (mapped) {
      return res.status(mapped.status).json({ error: mapped.message, details: mapped.details ?? null });
    }
  }

  console.error("Unhandled error:", err);
  const message = process.env.NODE_ENV === "production" ? "Internal server error" : String((err as Error)?.message ?? err);
  return res.status(500).json({ error: message });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Route not found" });
}

/** Wraps an async route handler so rejected promises reach errorHandler. */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
