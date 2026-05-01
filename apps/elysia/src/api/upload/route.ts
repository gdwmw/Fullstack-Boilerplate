import Elysia from "elysia";

import { responseMessage, SUCCESS_RESPONSE } from "@/src/constants";
import { accessJwtPlugin, handlePrismaError, verifyAccessToken } from "@/src/utils";

import { paramSchema, uploadSchema } from "./schema";
import { service } from "./service";
import { docs } from "./swagger";

const LABEL = "upload";

export const uploadRoutes = new Elysia({ prefix: "/upload" })
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

  .post(
    "/",
    async ({ body }) => {
      const { file } = uploadSchema.parse(body);
      const res = await service.upload(file);
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).created });
    },
    { detail: docs(LABEL).upload },
  );
