import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  // Falls back to a placeholder so pure-logic unit tests (jwt, password, payroll, …) can
  // import this module without a real Postgres instance; anything that actually touches
  // Prisma still needs a real DATABASE_URL set (see .env.example).
  databaseUrl: required("DATABASE_URL", "postgresql://kasrevent:kasrevent@localhost:5432/kasrevent?schema=public"),
  jwtSecret: required("JWT_SECRET", "dev-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 12),
  publicAppUrl: process.env.PUBLIC_APP_URL ?? "http://localhost:5173"
};

export const isProduction = env.nodeEnv === "production";
