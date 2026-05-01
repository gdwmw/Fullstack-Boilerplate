import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { join } from "path";

import { AuthRoutes, UploadRoutes, UsersRoutes } from "./api";
import { logger } from "./libs";

const ELYSIA_PORT = process.env.ELYSIA_PORT;

if (!process.env.ELYSIA_PORT) {
  throw new Error("Please check your environment variables. ELYSIA_PORT is not defined.");
}

if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error("Please check your environment variables. JWT_ACCESS_SECRET is not defined.");
}

if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error("Please check your environment variables. JWT_REFRESH_SECRET is not defined.");
}

if (!process.env.REDIS_URL) {
  throw new Error("Please check your environment variables. REDIS_URL is not defined.");
}

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...(process.env.CORS_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? []),
];

const requestStartTimes = new WeakMap<Request, number>();

const getStatusCode = (status: number | string | undefined, fallback = 200) => {
  if (typeof status === "number") {
    return status;
  }

  if (typeof status === "string") {
    const parsedStatus = Number(status);

    if (!Number.isNaN(parsedStatus)) {
      return parsedStatus;
    }
  }

  return fallback;
};

const getRequestLogger = (request: Request) => {
  const pathname = new URL(request.url).pathname;

  return logger.child({
    method: request.method,
    path: pathname,
  });
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

const app = new Elysia()
  .onRequest(({ request }) => {
    const requestLog = getRequestLogger(request);

    requestStartTimes.set(request, performance.now());
    requestLog.info("incoming request");
  })

  .onAfterHandle(({ request, set }) => {
    const requestLog = getRequestLogger(request);
    const startedAt = requestStartTimes.get(request) ?? performance.now();
    const durationMs = Math.round(performance.now() - startedAt);
    const statusCode = getStatusCode(set.status);

    requestLog.info({ durationMs, statusCode }, "request completed");
  })

  .onError(({ code, error, request, set }) => {
    const requestLog = getRequestLogger(request);
    const startedAt = requestStartTimes.get(request) ?? performance.now();
    const durationMs = Math.round(performance.now() - startedAt);
    const statusCode = getStatusCode(set.status, 500);

    requestLog.error(
      {
        code,
        durationMs,
        error: getErrorMessage(error),
        statusCode,
      },
      "request failed",
    );
  })

  .use(
    cors({
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      origin: (request) => {
        const origin = request.headers.get("origin");

        if (!origin) {
          return true;
        }

        return ALLOWED_ORIGINS.includes(origin);
      },
    }),
  )

  .use(
    swagger({
      documentation: {
        components: {
          securitySchemes: {
            bearerAuth: {
              bearerFormat: "JWT",
              scheme: "bearer",
              type: "http",
            },
          },
        },
        info: {
          description: "REST API built with ElysiaJS, Prisma, and JWT Authentication",
          title: "Elysia.js Boilerplate",
          version: "1.0.0",
        },
      },
    }),
  )

  .get("/", () => "Hello Elysia")

  .use(AuthRoutes)
  .use(UploadRoutes)
  .use(UsersRoutes)

  .get("/uploads/*", ({ params }) => Bun.file(join(process.cwd(), "uploads", params["*"])))
  .listen(ELYSIA_PORT || 1337);

logger.info(
  {
    serverUrl: `http://${app.server?.hostname}:${app.server?.port}`,
    swaggerUrl: `http://${app.server?.hostname}:${app.server?.port}/swagger`,
  },
  "elysia server started",
);
