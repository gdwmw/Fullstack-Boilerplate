import { cors } from "@elysiajs/cors";

import { env } from "@/src/environment";

const ALLOWED_ORIGINS = new Set(env.CORS_ORIGINS);

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
