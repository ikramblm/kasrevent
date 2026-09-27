import { describe, expect, it } from "vitest";
import { createSchema, updateSchema } from "../src/modules/users/users.routes";

// Found during the multi-tenant rework: an Admin manages only their own business's staff,
// and must never be able to create/promote another ADMIN or a SUPERADMIN through this
// endpoint — that tier is created exclusively via the Super Admin-only businesses module.
describe("users createSchema/updateSchema role whitelist", () => {
  it("accepts GERANT and USER roles", () => {
    expect(createSchema.safeParse({ nom: "A", email: "a@b.com", role: "GERANT", password: "password1" }).success).toBe(true);
    expect(createSchema.safeParse({ nom: "A", email: "a@b.com", role: "USER", password: "password1" }).success).toBe(true);
  });

  it("rejects ADMIN on create", () => {
    const result = createSchema.safeParse({ nom: "A", email: "a@b.com", role: "ADMIN", password: "password1" });
    expect(result.success).toBe(false);
  });

  it("rejects SUPERADMIN on create", () => {
    const result = createSchema.safeParse({ nom: "A", email: "a@b.com", role: "SUPERADMIN", password: "password1" });
    expect(result.success).toBe(false);
  });

  it("rejects ADMIN and SUPERADMIN on update too", () => {
    expect(updateSchema.safeParse({ role: "ADMIN" }).success).toBe(false);
    expect(updateSchema.safeParse({ role: "SUPERADMIN" }).success).toBe(false);
    expect(updateSchema.safeParse({ role: "GERANT" }).success).toBe(true);
  });
});
