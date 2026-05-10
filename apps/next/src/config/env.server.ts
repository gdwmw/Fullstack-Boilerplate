import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters"),
  NEXTAUTH_SESSION_EXPIRES_IN: z.string().min(1).default("7d"),
  NEXTAUTH_URL: z.url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`).join("\n");
  throw new Error(`invalid server environment variables:\n${issues}`);
}

export const serverEnv = parsed.data;
export type ServerEnv = typeof serverEnv;
