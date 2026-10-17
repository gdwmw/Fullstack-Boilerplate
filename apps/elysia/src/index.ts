import { Elysia } from "elysia";
import { normalize, resolve, sep } from "path";

import { authRoutes } from "./api/auth/route";
import { uploadRoutes } from "./api/upload/route";
import { usersRoutes } from "./api/users/route";
import { env } from "./environment";
import { logger } from "./libs/pino";
import { corsPlugin } from "./utils/plugins/corsPlugin";
import { requestLoggerPlugin } from "./utils/plugins/requestLoggerPlugin";
import { swaggerPlugin } from "./utils/plugins/swaggerPlugin";

const UPLOAD_DIR = resolve(process.cwd(), "uploads");

const resolveUploadPath = (relativePath: string | undefined) => {
  if (!relativePath) {
    return null;
  }

  const isNullBytePath = relativePath.includes("\0");
  const isAbsolutePath = relativePath.startsWith("/") || relativePath.startsWith("\\");

  if (isNullBytePath || isAbsolutePath) {
    return null;
  }

  const normalizedPath = normalize(relativePath);
  const hasParentDirectoryTraversal = normalizedPath.startsWith("..") || normalizedPath.includes(`..${sep}`);

  if (hasParentDirectoryTraversal) {
    return null;
  }

  const absolutePath = resolve(UPLOAD_DIR, normalizedPath);
  const isOutsideUploadDirectory = absolutePath !== UPLOAD_DIR && !absolutePath.startsWith(`${UPLOAD_DIR}${sep}`);

  if (isOutsideUploadDirectory) {
    return null;
  }

  return absolutePath;
};

const app = new Elysia()
  .use(corsPlugin)
  .use(requestLoggerPlugin)
  .use(swaggerPlugin)

  .get("/", () => "Hello Elysia")

  .get("/uploads/*", ({ params, set }) => {
    const uploadFilePath = resolveUploadPath(params["*"]);

    if (!uploadFilePath) {
      set.status = 400;
      return "invalid upload path";
    }

    return Bun.file(uploadFilePath);
  })

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
