import { Elysia } from "elysia";
import { normalize, resolve, sep } from "path";

import { authRoutes } from "./api/auth/route";
import { uploadRoutes } from "./api/upload/route";
import { usersRoutes } from "./api/users/route";
import { env } from "./environment";
import { logger } from "./libs/pino";
import { corsPlugin } from "./utils/plugins/corsPlugin";
import { swaggerPlugin } from "./utils/plugins/swaggerPlugin";

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

const app = new Elysia()
  .use(corsPlugin)
  .use(swaggerPlugin)

  .get("/", () => "Hello Elysia")
  .get("/uploads/*", ({ params, set }) => {
    const safePath = resolveUploadPath(params["*"]);

    if (!safePath) {
      set.status = 400;
      return "invalid upload path";
    }

    return Bun.file(safePath);
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
