import { cors } from "@elysiajs/cors";

const ALLOWED_ORIGINS = new Set([
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  ...(process.env.CORS_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? []),
]);

export const corsPlugin = cors({
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  origin: (request) => {
    const origin = request.headers.get("origin");

    if (!origin) {
      return true;
    }

    return ALLOWED_ORIGINS.has(origin);
  },
});
