import Elysia from "elysia";

import { responseMessage, SUCCESS_RESPONSE } from "@/src/constants";
import { accessJwtPlugin, handlePrismaError, verifyAccessToken } from "@/src/utils";

import { archiveQuerySchema, querySchema } from "./schema";
import { service } from "./service";
import { docs } from "./swagger";

const LABEL = "audit";

export const auditRoutes = new Elysia({ prefix: "/audit" })
  .use(accessJwtPlugin)

  .onError(({ error, set }) => handlePrismaError(LABEL, error, set))

  .onBeforeHandle(async ({ accessJwt, headers, set }) => {
    const verifyResponse = await verifyAccessToken({
      accessJwt,
      headers,
      set,
    });
    if (verifyResponse) {
      return verifyResponse;
    }
  })

  .get(
    "/archives",
    async ({ query }) => {
      const params = archiveQuerySchema.parse(query);
      const res = await service.getArchives(params);
      return SUCCESS_RESPONSE({ data: res, message: responseMessage("audit archives").retrieved });
    },
    { detail: docs(LABEL).getArchives },
  )

  .get(
    "/",
    async ({ query }) => {
      const params = querySchema.parse(query);
      const res = await service.getAll(params);
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).retrieved });
    },
    { detail: docs(LABEL).getAll },
  );
