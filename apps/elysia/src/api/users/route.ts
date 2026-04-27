import { jwt } from "@elysiajs/jwt";
import Elysia from "elysia";

import { responseMessage, SUCCESS_RESPONSE } from "@/src/constants";
import { handlePrismaError, verifyAccessToken } from "@/src/utils";

import { paramSchema, payloadSchema } from "./schema";
import { service } from "./service";
import { docs } from "./swagger";

const LABEL = "Users";

export const UsersRoutes = new Elysia({ prefix: "/users" })
  .use(
    jwt({
      exp: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
      name: "jwt",
      secret: process.env.JWT_ACCESS_SECRET || "",
    }),
  )

  .onError(({ error, set }) => handlePrismaError(LABEL, error, set))

  .onBeforeHandle(async ({ headers, jwt, set }) => {
    const verifyResponse = await verifyAccessToken({
      headers,
      jwt,
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

      return SUCCESS_RESPONSE(res, responseMessage(LABEL).deleted);
    },

    { detail: docs(LABEL)?.delete },
  )

  .get(
    "/",
    async () => {
      const res = await service.getAll();

      return SUCCESS_RESPONSE(res, responseMessage(LABEL).retrieved);
    },

    { detail: docs(LABEL)?.getAll },
  )

  .get(
    "/:id",
    async ({ params }) => {
      const { id } = paramSchema.parse(params);
      const res = await service.getById(id);

      return SUCCESS_RESPONSE(res, responseMessage(LABEL).retrieved);
    },

    { detail: docs(LABEL)?.getById },
  )

  .put(
    "/:id",
    async ({ body, params }) => {
      const { id } = paramSchema.parse(params);
      const payload = payloadSchema.parse(body);
      const res = await service.put(id, payload);

      return SUCCESS_RESPONSE(res, responseMessage(LABEL).updated);
    },

    { detail: docs(LABEL)?.put },
  );
