import "dotenv/config";
import { z } from "zod";

const booleanFromString = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((value) => (typeof value === "boolean" ? value : value === "true"));

const parseOriginList = (value: string): string[] => {
  const trimmed = value.trim();

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(trimmed);
  } catch {
    throw new Error('CORS_ORIGINS must be a valid JSON array, e.g., ["http://a","http://b"]');
  }

  if (!Array.isArray(parsedJson) || !parsedJson.every((item) => typeof item === "string")) {
    throw new Error("CORS_ORIGINS must be an array of strings");
  }

  return parsedJson.map((item) => item.trim()).filter(Boolean);
};

const envSchema = z.object({
  CORS_ORIGINS: z
    .string()
    .min(1, "CORS_ORIGINS must not be empty")
    .transform((value) => {
      const list = parseOriginList(value);
      if (list.length === 0) {
        throw new Error("CORS_ORIGINS must contain at least one origin");
      }
      return list;
    }),
  DATABASE_URL: z.url("DATABASE_URL must be a valid URL"),
  DB_BACKUP_DIR: z.string().min(1).default("./backups/database"),
  DB_BACKUP_RETENTION_DAYS: z.coerce.number().int().positive().default(365),
  ELYSIA_PORT: z.coerce.number().int().positive(),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1).default("15m"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_COOKIE_NAME: z.string().min(1).default("refreshToken"),
  JWT_REFRESH_COOKIE_PATH: z.string().min(1).default("/auth"),
  JWT_REFRESH_COOKIE_SAME_SITE: z.enum(["Lax", "Strict", "None"]).default("Lax"),
  JWT_REFRESH_COOKIE_SECURE: booleanFromString.default(false),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1).default("7d"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  LOG_DIR: z.string().min(1).default("./backups/logs"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  LOG_RETENTION_DAYS: z.coerce.number().int().positive().default(365),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`).join("\n");
  throw new Error(`invalid environment variables:\n${issues}`);
}

export const env = parsed.data;
export type Env = typeof env;
