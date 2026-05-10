import { Elysia } from "elysia";
import { join } from "path";

import { auditRoutes, authRoutes, uploadRoutes, usersRoutes } from "./api";
import { logger } from "./libs";
import {
  checkZstdAvailability,
  cleanupLogsWorker,
  cleanupSessionsWorker,
  corsPlugin,
  databaseBackupWorker,
  requestLoggerPlugin,
  swaggerPlugin,
} from "./utils";

const ELYSIA_PORT = process.env.ELYSIA_PORT;

if (!process.env.ELYSIA_PORT) {
  throw new Error("Please check your environment variables. ELYSIA_PORT is not defined.");
}

if (!process.env.DATABASE_URL) {
  throw new Error("Please check your environment variables. DATABASE_URL is not defined.");
}

if (!process.env.DB_BACKUP_DIR) {
  throw new Error("Please check your environment variables. DB_BACKUP_DIR is not defined.");
}

if (!process.env.DB_BACKUP_RETENTION_DAYS) {
  throw new Error("Please check your environment variables. DB_BACKUP_RETENTION_DAYS is not defined.");
}

if (!process.env.LOG_LEVEL) {
  throw new Error("Please check your environment variables. LOG_LEVEL is not defined.");
}

if (!process.env.LOG_DIR) {
  throw new Error("Please check your environment variables. LOG_DIR is not defined.");
}

if (!process.env.LOG_RETENTION_DAYS) {
  throw new Error("Please check your environment variables. LOG_RETENTION_DAYS is not defined.");
}

if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error("Please check your environment variables. JWT_ACCESS_SECRET is not defined.");
}

if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error("Please check your environment variables. JWT_REFRESH_SECRET is not defined.");
}

if (!process.env.JWT_ACCESS_EXPIRES_IN) {
  throw new Error("Please check your environment variables. JWT_ACCESS_EXPIRES_IN is not defined.");
}

if (!process.env.JWT_REFRESH_EXPIRES_IN) {
  throw new Error("Please check your environment variables. JWT_REFRESH_EXPIRES_IN is not defined.");
}

if (!process.env.JWT_REFRESH_COOKIE_NAME) {
  throw new Error("Please check your environment variables. JWT_REFRESH_COOKIE_NAME is not defined.");
}

if (!process.env.JWT_REFRESH_COOKIE_PATH) {
  throw new Error("Please check your environment variables. JWT_REFRESH_COOKIE_PATH is not defined.");
}

if (!process.env.JWT_REFRESH_COOKIE_SAME_SITE) {
  throw new Error("Please check your environment variables. JWT_REFRESH_COOKIE_SAME_SITE is not defined.");
}

if (process.env.JWT_REFRESH_COOKIE_SECURE === undefined) {
  throw new Error("Please check your environment variables. JWT_REFRESH_COOKIE_SECURE is not defined.");
}

if (!process.env.CORS_ORIGINS) {
  throw new Error("Please check your environment variables. CORS_ORIGINS is not defined.");
}

if (!process.env.REDIS_URL) {
  throw new Error("Please check your environment variables. REDIS_URL is not defined.");
}

checkZstdAvailability().then((isAvailable) => {
  if (isAvailable) {
    logger.info("zstd binary detected. Audit log compression is enabled.");
    return;
  }

  logger.error("zstd binary is not available in PATH. audit log compression/decompression may fail.");
});

const app = new Elysia()
  .use(corsPlugin)
  .use(swaggerPlugin)
  .use(requestLoggerPlugin)

  .get("/", () => "Hello Elysia")
  .get("/uploads/*", ({ params }) => Bun.file(join(process.cwd(), "uploads", params["*"])))

  .use(auditRoutes)
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

Bun.cron("0 9,12,15,18 * * *", async () => {
  await databaseBackupWorker();
});

Bun.cron("0 1 * * *", async () => {
  await cleanupLogsWorker();
});
