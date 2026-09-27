import { describe, expect, it, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { z } from "zod";
import { crudRouter } from "../src/utils/crudFactory";
import { errorHandler } from "../src/middleware/errors";
import { signToken } from "../src/utils/jwt";
import type { Role } from "@prisma/client";

/**
 * Found in the pre-multi-tenancy audit: every generic CRUD list/read endpoint
 * (Clients, Salles, Décorations, Traiteurs, Fournisseurs) returned ALL rows in the
 * database regardless of which business created them. This proves the fix — two
 * businesses' rows never leak into each other — against the real crudRouter, backed
 * by an in-memory fake standing in for Prisma so no real database is needed.
 */
type Row = { id: string; businessId: string; nom: string };

function makeFakeDelegate(rows: Row[]) {
  let nextId = 1;
  return {
    findMany: async (args?: any) => rows.filter((r) => !args?.where?.businessId || r.businessId === args.where.businessId),
    findUnique: async (args: any) => rows.find((r) => r.id === args.where.id) ?? null,
    create: async (args: any) => {
      const row = { id: `row-${nextId++}`, ...args.data };
      rows.push(row);
      return row;
    },
    update: async (args: any) => {
      const row = rows.find((r) => r.id === args.where.id)!;
      Object.assign(row, args.data);
      return row;
    },
    delete: async (args: any) => {
      const i = rows.findIndex((r) => r.id === args.where.id);
      rows.splice(i, 1);
    }
  };
}

// crudRouter's own routes apply the real `authenticate` middleware, so a fake req.user
// injected upstream would be ignored — sign a real token instead, same as a live client.
function tokenFor(businessId: string, role: Role = "ADMIN") {
  return signToken({ sub: "caller-1", role, email: "caller@test.local", businessId });
}

function buildApp(rows: Row[]) {
  const app = express();
  app.use(express.json());
  app.use(
    "/things",
    crudRouter(makeFakeDelegate(rows) as any, {
      createSchema: z.object({ nom: z.string() }),
      updateSchema: z.object({ nom: z.string().optional() })
    })
  );
  app.use(errorHandler);
  return app;
}

describe("crudRouter tenant isolation", () => {
  let rows: Row[];

  beforeEach(() => {
    rows = [
      { id: "a1", businessId: "biz-A", nom: "Business A's client" },
      { id: "b1", businessId: "biz-B", nom: "Business B's client" }
    ];
  });

  it("GET / only returns the caller's own business's rows", async () => {
    const app = buildApp(rows);
    const res = await request(app).get("/things").set("Authorization", `Bearer ${tokenFor("biz-A")}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe("a1");
  });

  it("GET /:id 404s (not leaks) another business's row", async () => {
    const app = buildApp(rows);
    const res = await request(app).get("/things/b1").set("Authorization", `Bearer ${tokenFor("biz-A")}`);
    expect(res.status).toBe(404);
  });

  it("GET /:id succeeds for the caller's own row", async () => {
    const app = buildApp(rows);
    const res = await request(app).get("/things/a1").set("Authorization", `Bearer ${tokenFor("biz-A")}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("a1");
  });

  it("POST / stamps the caller's businessId even if the body tries to override it", async () => {
    const app = buildApp(rows);
    const res = await request(app)
      .post("/things")
      .set("Authorization", `Bearer ${tokenFor("biz-A")}`)
      .send({ nom: "New thing", businessId: "biz-B" });
    expect(res.status).toBe(201);
    expect(res.body.businessId).toBe("biz-A");
  });

  it("PATCH /:id on another business's row 404s instead of applying the update", async () => {
    const app = buildApp(rows);
    const res = await request(app)
      .patch("/things/b1")
      .set("Authorization", `Bearer ${tokenFor("biz-A")}`)
      .send({ nom: "hijacked" });
    expect(res.status).toBe(404);
    expect(rows.find((r) => r.id === "b1")!.nom).toBe("Business B's client");
  });

  it("DELETE /:id on another business's row 404s instead of deleting it", async () => {
    const app = buildApp(rows);
    const res = await request(app).delete("/things/b1").set("Authorization", `Bearer ${tokenFor("biz-A")}`);
    expect(res.status).toBe(404);
    expect(rows.find((r) => r.id === "b1")).toBeDefined();
  });
});
