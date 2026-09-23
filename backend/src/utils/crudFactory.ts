import { Router } from "express";
import type { ZodTypeAny } from "zod";
import { asyncHandler, ApiError } from "../middleware/errors";
import { validateBody } from "../middleware/validate";
import { authenticate, authorize } from "../middleware/auth";
import type { Role } from "@prisma/client";

interface Delegate {
  findMany: (args?: any) => Promise<any[]>;
  findUnique: (args: any) => Promise<any | null>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
}

interface CrudOptions {
  createSchema: ZodTypeAny;
  updateSchema: ZodTypeAny;
  /** Roles allowed to write (create/update/delete). Reads only require authentication. */
  writeRoles?: Role[];
  orderBy?: Record<string, "asc" | "desc">;
  include?: Record<string, boolean>;
}

/**
 * Generic REST CRUD router for the app's simpler reference tables (Clients, Salles,
 * Fournisseurs, Traiteurs, Décorations, …). Bespoke business logic (reservations, charges,
 * check-in, payroll) is NOT built on this factory — those live in their own modules because
 * the original AppSheet Actions/Automations for them do real cross-table work.
 */
export function crudRouter(delegate: Delegate, options: CrudOptions): Router {
  const router = Router();
  const writeGuard = options.writeRoles ? [authenticate, authorize(...options.writeRoles)] : [authenticate];

  router.get(
    "/",
    authenticate,
    asyncHandler(async (_req, res) => {
      const items = await delegate.findMany({ orderBy: options.orderBy, include: options.include });
      res.json(items);
    })
  );

  router.get(
    "/:id",
    authenticate,
    asyncHandler(async (req, res) => {
      const item = await delegate.findUnique({ where: { id: req.params.id }, include: options.include });
      if (!item) throw ApiError.notFound();
      res.json(item);
    })
  );

  router.post(
    "/",
    ...writeGuard,
    validateBody(options.createSchema),
    asyncHandler(async (req, res) => {
      const item = await delegate.create({ data: req.body });
      res.status(201).json(item);
    })
  );

  router.patch(
    "/:id",
    ...writeGuard,
    validateBody(options.updateSchema),
    asyncHandler(async (req, res) => {
      const item = await delegate.update({ where: { id: req.params.id }, data: req.body });
      res.json(item);
    })
  );

  router.delete(
    "/:id",
    ...writeGuard,
    asyncHandler(async (req, res) => {
      await delegate.delete({ where: { id: req.params.id } });
      res.status(204).send();
    })
  );

  return router;
}
