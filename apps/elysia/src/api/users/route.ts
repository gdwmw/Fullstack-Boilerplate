import Elysia from "elysia";

import { responseMessage, SUCCESS_RESPONSE } from "@/src/constants";
import { accessJwtPlugin } from "@/src/libs";
import { handlePrismaError, verifyAccessToken } from "@/src/utils";

import { paramSchema, payloadSchema } from "./schema";
import { service } from "./service";
import { docs } from "./swagger";

// ---------------------------------------------------------------------------
// [1] Constants
// Label dan konstanta lain yang dipakai di seluruh modul users
// ---------------------------------------------------------------------------

const LABEL = "Users";

// ---------------------------------------------------------------------------
// [2] UsersRoutes
// Semua endpoint users, penomoran sinkron dengan README
// ---------------------------------------------------------------------------

export const UsersRoutes = new Elysia({ prefix: "/users" })
  .use(accessJwtPlugin)

  // [2.1] Error handler global untuk users
  .onError(({ error, set }) => handlePrismaError(LABEL, error, set))

  // [2.2] Auth guard: semua endpoint users harus login
  .onBeforeHandle(async ({ accessJwt, headers, set }) => {
    // [2.2.1] Verifikasi access token sebelum proses apapun
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

  // [2.3] Hapus user
  .delete(
    "/:id",
    async ({ params }) => {
      // [2.3.1] Validasi param id
      const { id } = paramSchema.parse(params);
      // [2.3.2] Hapus user dari DB
      const res = await service.delete(id);
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).deleted });
    },
    { detail: docs(LABEL).delete },
  )

  // [2.4] Ambil semua user
  .get(
    "/",
    async () => {
      // [2.4.1] Ambil semua user dari DB
      const res = await service.getAll();
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).retrieved });
    },
    { detail: docs(LABEL).getAll },
  )

  // [2.5] Ambil user by id
  .get(
    "/:id",
    async ({ params }) => {
      // [2.5.1] Validasi param id
      const { id } = paramSchema.parse(params);
      // [2.5.2] Ambil user dari DB
      const res = await service.getById(id);
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).retrieved });
    },
    { detail: docs(LABEL).getById },
  )

  // [2.6] Update user
  .put(
    "/:id",
    async ({ body, params }) => {
      // [2.6.1] Validasi param id dan body
      const { id } = paramSchema.parse(params);
      const payload = payloadSchema.parse(body);
      // [2.6.2] Update user di DB
      const res = await service.put(id, payload);
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).updated });
    },
    { detail: docs(LABEL).put },
  );
