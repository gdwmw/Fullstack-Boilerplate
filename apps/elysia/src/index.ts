import { Elysia } from "elysia";
import { join } from "path";

import { authRoutes, uploadRoutes, usersRoutes } from "./api";
import { logger } from "./libs";
import { cleanupSessionsWorker, corsPlugin, requestLoggerPlugin, swaggerPlugin } from "./utils";

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

const app = new Elysia()
  .use(corsPlugin)
  .use(swaggerPlugin)
  .use(requestLoggerPlugin)

  .get("/", () => "Hello Elysia")
  .get("/uploads/*", ({ params }) => Bun.file(join(process.cwd(), "uploads", params["*"])))

  .use(authRoutes)
  .use(uploadRoutes)
  .use(usersRoutes)

  .listen(ELYSIA_PORT || 1337);

logger.info(
  {
    serverUrl: `http://${app.server?.hostname}:${app.server?.port}`,
    swaggerUrl: `http://${app.server?.hostname}:${app.server?.port}/swagger`,
  },
  "elysia server started",
);

Bun.cron("0 0 */4 * *", async () => {
  await cleanupSessionsWorker();
});
