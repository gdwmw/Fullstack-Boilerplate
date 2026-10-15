import "dotenv/config";
import { z } from "zod";

const parseOriginList = (value: string): string[] => {
  const trimmedValue = value.trim();

  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(trimmedValue);
  } catch {
    throw new Error('CORS_ORIGINS must be a valid JSON array, e.g., ["http://a","http://b"]');
  }

  if (!Array.isArray(parsedValue) || !parsedValue.every((item) => typeof item === "string")) {
    throw new Error("CORS_ORIGINS must be an array of strings");
  }

  return parsedValue.map((origin) => origin.trim()).filter(Boolean);
};

const envSchema = z.object({
  CORS_ORIGINS: z
    .string()
    .min(1, "CORS_ORIGINS must not be empty")
    .transform((value) => {
      const origins = parseOriginList(value);

      if (origins.length === 0) {
        throw new Error("CORS_ORIGINS must contain at least one origin");
      }

      return origins;
    }),
  DATABASE_URL: z.url("DATABASE_URL must be a valid URL"),
  ELYSIA_PORT: z.coerce.number().int().positive(),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1).default("15m"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1).default("7d"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  REFRESH_TOKEN_COOKIE_SECRET: z.string().min(32, "REFRESH_TOKEN_COOKIE_SECRET must be at least 32 characters"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const validationIssues = parsed.error.issues.map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`).join("\n");

  throw new Error(`invalid environment variables:\n${validationIssues}`);
}

export const env = parsed.data;
export type Env = typeof env;
