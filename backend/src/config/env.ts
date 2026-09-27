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
  publicAppUrl: process.env.PUBLIC_APP_URL ?? "http://localhost:5173",
  // The secret used to activate this deployment's owner account after the one-time license
  // fee is paid (see auth.routes.ts POST /activate). Left unset, activation is always refused
  // — every deployment must set its own value so one customer's secret can't unlock another's.
  activationSecret: process.env.ACTIVATION_SECRET
};

export const isProduction = env.nodeEnv === "production";
