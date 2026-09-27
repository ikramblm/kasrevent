import { z } from "zod";

export const createBusinessSchema = z.object({
  businessNom: z.string().min(1),
  adminNom: z.string().min(1),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8, "Password must be at least 8 characters")
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
