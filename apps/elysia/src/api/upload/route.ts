import Elysia from "elysia";

import { responseMessage, SUCCESS_RESPONSE } from "@/src/constants";
import { accessJwtPlugin } from "@/src/libs";
import { handlePrismaError, verifyAccessToken } from "@/src/utils";

import { paramSchema, uploadSchema } from "./schema";
import { service } from "./service";
import { docs } from "./swagger";

// ---------------------------------------------------------------------------
// [1] Constants
// Label and other constants used throughout the upload module.
// ---------------------------------------------------------------------------

const LABEL = "Upload";

// ---------------------------------------------------------------------------
// [2] UploadRoutes
// All upload endpoints. Numbering is kept in sync with the README.
// ---------------------------------------------------------------------------

export const UploadRoutes = new Elysia({ prefix: "/upload" })
  .use(accessJwtPlugin)

  // [2.1] Global error handler for upload
  .onError(({ error, set }) => handlePrismaError(LABEL, error, set))

  // [2.2] Auth guard: all upload endpoints require authentication
  .onBeforeHandle(async ({ accessJwt, headers, set }) => {
    // [2.2.1] Verify the access token before doing anything
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

  // [2.3] Delete a file
  .delete(
    "/:id",
    async ({ params }) => {
      // [2.3.1] Validate the id param
      const { id } = paramSchema.parse(params);
      // [2.3.2] Delete the file from the database and disk
      const res = await service.delete(id);
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).deleted });
    },
    { detail: docs(LABEL).delete },
  )

  // [2.4] Get all files
  .get(
    "/",
    async () => {
      // [2.4.1] Fetch all files from the database
      const res = await service.getAll();
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).retrieved });
    },
    { detail: docs(LABEL).getAll },
  )

  // [2.5] Get a file by id
  .get(
    "/:id",
    async ({ params }) => {
      // [2.5.1] Validate the id param
      const { id } = paramSchema.parse(params);
      // [2.5.2] Fetch the file from the database
      const res = await service.getById(id);
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).retrieved });
    },
    { detail: docs(LABEL).getById },
  )

  // [2.6] Upload a new file
  .post(
    "/",
    async ({ body }) => {
      // [2.6.1] Validate the upload body
      const { file } = uploadSchema.parse(body);
      // [2.6.2] Process the upload and persist it to DB/disk
      const res = await service.upload(file);
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).created });
    },
    { detail: docs(LABEL).upload },
  );
