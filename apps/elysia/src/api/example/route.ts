import Elysia from "elysia";

import { responseMessage } from "@/src/constants/responseMessage";
import { SUCCESS_RESPONSE } from "@/src/constants/responseTemplate";
import { protectedRoutePlugin } from "@/src/utils/plugins/protectedRoutePlugin";

import { createPayloadSchema, paramSchema, querySchema, updatePayloadSchema } from "./schema";
import { service } from "./service";
import { docs } from "./swagger";

const LABEL = "examples";

export const exampleRoutes = new Elysia({ prefix: "/examples" })
  .use(protectedRoutePlugin)

  .post(
    "/",
    async ({ body }) => {
      const payload = createPayloadSchema.parse(body);
      const res = await service.create({ payload });
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).created });
    },
    { detail: docs(LABEL).create },
  )

  .get(
    "/",
    async ({ query: rawQuery }) => {
      const query = querySchema.parse(rawQuery);
      const res = await service.getAll({ query });
      return SUCCESS_RESPONSE({ data: res.data, message: responseMessage(LABEL).retrieved, meta: res.meta });
    },
    { detail: docs(LABEL).getAll },
  )

  .get(
    "/:id",
    async ({ params }) => {
      const param = paramSchema.parse(params);
      const res = await service.getById({ param });
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).retrieved });
    },
    { detail: docs(LABEL).getById },
  )

  .put(
    "/:id",
    async ({ body, params }) => {
      const param = paramSchema.parse(params);
      const payload = updatePayloadSchema.parse(body);
      const res = await service.update({ param, payload });
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).updated });
    },
    { detail: docs(LABEL).update },
  )

  .delete(
    "/:id",
    async ({ params }) => {
      const param = paramSchema.parse(params);
      const res = await service.delete({ param });
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).deleted });
    },
    { detail: docs(LABEL).delete },
  );
