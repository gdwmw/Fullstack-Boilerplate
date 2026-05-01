import Elysia from "elysia";

import { responseMessage, SUCCESS_RESPONSE } from "@/src/constants";
import { accessJwtPlugin, handlePrismaError, verifyAccessToken } from "@/src/utils";

import { paramSchema, payloadSchema } from "./schema";
import { service } from "./service";
import { docs } from "./swagger";

const LABEL = "users";

export const UsersRoutes = new Elysia({ prefix: "/users" })
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
    return;
  })

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
    async () => {
      const res = await service.getAll();
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).retrieved });
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
