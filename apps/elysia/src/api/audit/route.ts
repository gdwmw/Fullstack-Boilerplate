import Elysia from "elysia";

import { responseMessage, SUCCESS_RESPONSE } from "@/src/constants";
import { accessJwtPlugin, handlePrismaError, verifyAccessToken } from "@/src/utils";

import { querySchema } from "./schema";
import { service } from "./service";
import { docs } from "./swagger";

const LABEL = "audit logs";

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
    "/",
    async ({ query }) => {
      const params = querySchema.parse(query);
      const res = await service.getAll(params);
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).retrieved });
    },
    { detail: docs(LABEL).getAll },
  );
