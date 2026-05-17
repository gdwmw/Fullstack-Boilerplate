import Elysia from "elysia";

import { responseMessage, SUCCESS_RESPONSE } from "@/src/constants";
import { protectedRoutePlugin } from "@/src/utils";

import { archiveQuerySchema, querySchema } from "./schema";
import { service } from "./service";
import { docs } from "./swagger";

const LABEL = "audit";

export const auditRoutes = new Elysia({ prefix: "/audit" })
  .use(protectedRoutePlugin(LABEL))

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
      return SUCCESS_RESPONSE({ data: res.data, message: responseMessage(LABEL).retrieved, meta: res.meta });
    },
    { detail: docs(LABEL).getAll },
  );
