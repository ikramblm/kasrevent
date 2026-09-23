import bcrypt from "bcryptjs";
import { env } from "../config/env";

/**
 * The original AppSheet app stored `Utilisateurs.Mot de passe` as plain text and compared
 * it with a simple `=` in a Valid_If expression (see docs/ASSUMPTIONS.md). That is not
 * reproduced here: passwords are always bcrypt-hashed at rest and compared with bcrypt.compare.
 */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.bcryptSaltRounds);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
