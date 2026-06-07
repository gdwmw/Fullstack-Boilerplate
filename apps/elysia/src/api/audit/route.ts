import Elysia from "elysia";

import { responseMessage } from "@/src/constants/responseMessage";
import { SUCCESS_RESPONSE } from "@/src/constants/responseTemplate";
import { protectedRoutePlugin } from "@/src/utils/plugins/protectedRoutePlugin";

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
      const res = await service.getAllArchives(params);
      return SUCCESS_RESPONSE({ data: res.data, message: responseMessage("audit archives").retrieved, meta: res.meta });
    },
    { detail: docs(LABEL).getArchives },
  )

  .get(
    "/",
    async ({ query }) => {
      const params = querySchema.parse(query);
      const res = await service.getAllLogs(params);
      return SUCCESS_RESPONSE({ data: res.data, message: responseMessage(LABEL).retrieved, meta: res.meta });
    },
    { detail: docs(LABEL).getAll },
  );
