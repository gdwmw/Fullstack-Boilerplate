import Elysia from "elysia";

import { responseMessage, SUCCESS_RESPONSE } from "@/src/constants";
import { accessJwtPlugin } from "@/src/libs";
import { handlePrismaError, verifyAccessToken } from "@/src/utils";

import { paramSchema, uploadSchema } from "./schema";
import { service } from "./service";
import { docs } from "./swagger";

// ---------------------------------------------------------------------------
// [1] Constants
// Label dan konstanta lain yang dipakai di seluruh modul upload
// ---------------------------------------------------------------------------

const LABEL = "Upload";

// ---------------------------------------------------------------------------
// [2] UploadRoutes
// Semua endpoint upload, penomoran sinkron dengan README
// ---------------------------------------------------------------------------

export const UploadRoutes = new Elysia({ prefix: "/upload" })
  .use(accessJwtPlugin)

  // [2.1] Error handler global untuk upload
  .onError(({ error, set }) => handlePrismaError(LABEL, error, set))

  // [2.2] Auth guard: semua endpoint upload harus login
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

  // [2.3] Hapus file
  .delete(
    "/:id",
    async ({ params }) => {
      // [2.3.1] Validasi param id
      const { id } = paramSchema.parse(params);
      // [2.3.2] Hapus file dari DB dan disk
      const res = await service.delete(id);
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).deleted });
    },
    { detail: docs(LABEL).delete },
  )

  // [2.4] Ambil semua file
  .get(
    "/",
    async () => {
      // [2.4.1] Ambil semua file dari DB
      const res = await service.getAll();
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).retrieved });
    },
    { detail: docs(LABEL).getAll },
  )

  // [2.5] Ambil file by id
  .get(
    "/:id",
    async ({ params }) => {
      // [2.5.1] Validasi param id
      const { id } = paramSchema.parse(params);
      // [2.5.2] Ambil file dari DB
      const res = await service.getById(id);
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).retrieved });
    },
    { detail: docs(LABEL).getById },
  )

  // [2.6] Upload file baru
  .post(
    "/",
    async ({ body }) => {
      // [2.6.1] Validasi body upload
      const { file } = uploadSchema.parse(body);
      // [2.6.2] Proses upload dan simpan ke DB/disk
      const res = await service.upload(file);
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).created });
    },
    { detail: docs(LABEL).upload },
  );
