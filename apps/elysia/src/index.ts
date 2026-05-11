import { Elysia } from "elysia";
import { normalize, resolve, sep } from "path";

import { auditRoutes, authRoutes, uploadRoutes, usersRoutes } from "./api";
import { env } from "./environment";
import { logger } from "./libs";
import {
    checkZstdAvailability,
    cleanupLogsWorker,
    corsPlugin,
    databaseBackupWorker,
    requestLoggerPlugin,
    swaggerPlugin,
} from "./utils";

const UPLOAD_DIR = resolve(process.cwd(), "uploads");

const resolveUploadPath = (relative: string | undefined) => {
  if (!relative) return null;

  if (relative.includes("\0") || relative.startsWith("/") || relative.startsWith("\\")) {
    return null;
  }

  const normalized = normalize(relative);
  if (normalized.startsWith("..") || normalized.includes(`..${sep}`)) {
    return null;
  }

  const absolute = resolve(UPLOAD_DIR, normalized);
  if (absolute !== UPLOAD_DIR && !absolute.startsWith(`${UPLOAD_DIR}${sep}`)) {
    return null;
  }

  return absolute;
};

checkZstdAvailability().then((isAvailable) => {
  if (isAvailable) {
    logger.info("zstd binary detected. audit log compression is enabled.");
    return;
  }

  logger.error("zstd binary is not available in PATH. audit log compression/decompression may fail.");
});

const app = new Elysia()
  .use(corsPlugin)
  .use(swaggerPlugin)
  .use(requestLoggerPlugin)

  .get("/", () => "Hello Elysia")
  .get("/uploads/*", ({ params, set }) => {
    const safePath = resolveUploadPath(params["*"]);

    if (!safePath) {
      set.status = 400;
      return "invalid upload path";
    }

    return Bun.file(safePath);
  })

  .use(auditRoutes)
  .use(authRoutes)
  .use(uploadRoutes)
  .use(usersRoutes)

  .listen(env.ELYSIA_PORT);

logger.info(
  {
    serverUrl: `http://${app.server?.hostname}:${app.server?.port}`,
    swaggerUrl: `http://${app.server?.hostname}:${app.server?.port}/swagger`,
  },
  "elysia server started",
);

Bun.cron("0 9,12,15,18 * * *", async () => {
  await databaseBackupWorker();
});

Bun.cron("0 1 * * *", async () => {
  await cleanupLogsWorker();
});
