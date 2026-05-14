import Elysia from "elysia";

import { responseMessage, SUCCESS_RESPONSE } from "@/src/constants";
import { protectedRoutePlugin } from "@/src/utils";

import { paramSchema, payloadSchema, querySchema } from "./schema";
import { service } from "./service";
import { docs } from "./swagger";

const LABEL = "users";

export const usersRoutes = new Elysia({ prefix: "/users" })
  .use(protectedRoutePlugin(LABEL))

  .delete(
    "/:id",
    async ({ params }) => {
      const { id } = paramSchema.parse(params);
      const res = await service.delete(id);
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).deleted });
    },
    { detail: docs(LABEL).delete },
  )

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

  .put(
    "/:id",
    async ({ body, params }) => {
      const { id } = paramSchema.parse(params);
      const payload = payloadSchema.parse(body);
      const res = await service.put(id, payload);
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).updated });
    },
    { detail: docs(LABEL).put },
  );
