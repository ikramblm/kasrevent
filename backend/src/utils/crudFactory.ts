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
    asyncHandler(async (req, res) => {
      const items = await delegate.findMany({
        where: { businessId: req.user!.businessId },
        orderBy: options.orderBy,
        include: options.include
      });
      res.json(items);
    })
  );

  router.get(
    "/:id",
    authenticate,
    asyncHandler(async (req, res) => {
      const item = await delegate.findUnique({ where: { id: req.params.id }, include: options.include });
      // 404 (not 403) for a row that exists but belongs to another business, so a caller
      // can't distinguish "doesn't exist" from "exists in someone else's tenant".
      if (!item || item.businessId !== req.user!.businessId) throw ApiError.notFound();
      res.json(item);
    })
  );

  router.post(
    "/",
    ...writeGuard,
    validateBody(options.createSchema),
    asyncHandler(async (req, res) => {
      // businessId stamped after the spread so a client can't override it via the body.
      const item = await delegate.create({ data: { ...req.body, businessId: req.user!.businessId } });
      res.status(201).json(item);
    })
  );

  router.patch(
    "/:id",
    ...writeGuard,
    validateBody(options.updateSchema),
    asyncHandler(async (req, res) => {
      const existing = await delegate.findUnique({ where: { id: req.params.id } });
      if (!existing || existing.businessId !== req.user!.businessId) throw ApiError.notFound();
      const item = await delegate.update({ where: { id: req.params.id }, data: req.body });
      res.json(item);
    })
  );

  router.delete(
    "/:id",
    ...writeGuard,
    asyncHandler(async (req, res) => {
      const existing = await delegate.findUnique({ where: { id: req.params.id } });
      if (!existing || existing.businessId !== req.user!.businessId) throw ApiError.notFound();
      await delegate.delete({ where: { id: req.params.id } });
      res.status(204).send();
    })
  );

  return router;
}
