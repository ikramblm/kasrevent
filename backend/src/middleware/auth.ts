import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { verifyToken } from "../utils/jwt";
import { ApiError } from "./errors";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: Role; email: string | null };
    }
  }
}

/** Requires a valid Bearer JWT. Mirrors the original app's `USERSETTINGS("Utilisateur")` sign-in gate. */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Missing bearer token"));
  }
  try {
    const payload = verifyToken(header.slice("Bearer ".length));
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired token"));
  }
}

/**
 * Requires the caller's role to be one of `roles`. Mirrors the original app's view-level
 * `USERSETTINGS("Rôle")` gates (Admin-only / Admin+Gerant) — but enforced server-side on
 * every request, unlike the source app where this was only a client-side Show_If (see
 * docs/ASSUMPTIONS.md, "row-level security").
 */
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Requires role: ${roles.join(" or ")}`));
    }
    next();
  };
}
