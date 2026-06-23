import Elysia from "elysia";

import { responseMessage } from "@/src/constants/responseMessage";
import { SUCCESS_RESPONSE } from "@/src/constants/responseTemplate";
import { protectedRoutePlugin } from "@/src/utils/plugins/protectedRoutePlugin";

import { paramSchema, querySchema, uploadSchema } from "./schema";
import { service } from "./service";
import { docs } from "./swagger";

const LABEL = "upload";

export const uploadRoutes = new Elysia({ prefix: "/upload" })
  .use(protectedRoutePlugin(LABEL))

  .get(
    "/",
    async ({ query }) => {
      const params = querySchema.parse(query);
      const res = await service.getAll(params);
      return SUCCESS_RESPONSE({ data: res.data, message: responseMessage(LABEL).retrieved, meta: res.meta });
    },
    { detail: docs(LABEL).getAll },
  )

  .get(
    "/:id",
    async ({ params }) => {
      const { id } = paramSchema.parse(params);
      const res = await service.getById(id);
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).retrieved });
    },
    { detail: docs(LABEL).getById },
  )

  .post(
    "/",
    async ({ body }) => {
      const { file } = uploadSchema.parse(body);
      const res = await service.upload(file);
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).created });
    },
    { detail: docs(LABEL).upload },
  )

  .delete(
    "/:id",
    async ({ params }) => {
      const { id } = paramSchema.parse(params);
      const res = await service.delete(id);
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).deleted });
    },
    { detail: docs(LABEL).delete },
  );
