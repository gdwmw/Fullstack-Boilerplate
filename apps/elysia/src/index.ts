import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { join } from "path";

import { AuthRoutes, UploadRoutes, UsersRoutes } from "./api";

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

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...(process.env.CORS_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? []),
];

const app = new Elysia()
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
  // Serve uploaded files statically
  .get("/uploads/*", ({ params }) => Bun.file(join(process.cwd(), "uploads", params["*"])))
  .listen(ELYSIA_PORT || 1337);

const BLUE = "\x1b[34m";
const RESET = "\x1b[0m";

console.log(
  `🦊 Elysia is running at ${BLUE}http://${app.server?.hostname}:${app.server?.port}${RESET} and Swagger is available at ${BLUE}http://${app.server?.hostname}:${app.server?.port}/swagger${RESET}`,
);
