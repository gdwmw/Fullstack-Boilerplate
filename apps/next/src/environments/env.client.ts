import { z } from "zod";

const booleanFromString = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((value) => (typeof value === "boolean" ? value : value === "true"));

const clientEnvSchema = z.object({
  NEXT_PUBLIC_ACCESS_TOKEN_EXPIRES_IN: z.string().min(1).default("15m"),
  NEXT_PUBLIC_BASE_API_URL: z.string().min(1, "NEXT_PUBLIC_BASE_API_URL is required").url(),
  NEXT_PUBLIC_DEBUG_MODE: booleanFromString.default(false),
  NEXT_PUBLIC_REFRESH_BUFFER_MS: z.string().min(1).default("15s"),
});

const rawClientEnv = {
  NEXT_PUBLIC_ACCESS_TOKEN_EXPIRES_IN: process.env.NEXT_PUBLIC_ACCESS_TOKEN_EXPIRES_IN,
  NEXT_PUBLIC_BASE_API_URL: process.env.NEXT_PUBLIC_BASE_API_URL,
  NEXT_PUBLIC_DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE,
  NEXT_PUBLIC_REFRESH_BUFFER_MS: process.env.NEXT_PUBLIC_REFRESH_BUFFER_MS,
};

const parsed = clientEnvSchema.safeParse(rawClientEnv);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`).join("\n");
  throw new Error(`invalid client environment variables:\n${issues}`);
}

export const clientEnv = parsed.data;
export type ClientEnv = typeof clientEnv;
