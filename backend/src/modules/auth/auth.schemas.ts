import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export type LoginInput = z.infer<typeof loginSchema>;

export const activateSchema = z.object({
  email: z.string().email(),
  secret: z.string().min(1)
});

export type ActivateInput = z.infer<typeof activateSchema>;
