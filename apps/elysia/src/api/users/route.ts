import Elysia from "elysia";

import { responseMessage, SUCCESS_RESPONSE } from "@/src/constants";
import { accessJwtPlugin } from "@/src/libs";
import { handlePrismaError, verifyAccessToken } from "@/src/utils";

import { paramSchema, payloadSchema } from "./schema";
import { service } from "./service";
import { docs } from "./swagger";

// ---------------------------------------------------------------------------
// [1] Constants
// Label and other constants used throughout the users module.
// ---------------------------------------------------------------------------

const LABEL = "Users";

// ---------------------------------------------------------------------------
// [2] UsersRoutes
// All users endpoints. Numbering is kept in sync with the README.
// ---------------------------------------------------------------------------

export const UsersRoutes = new Elysia({ prefix: "/users" })
  .use(accessJwtPlugin)

  // [2.1] Global error handler for users
  .onError(({ error, set }) => handlePrismaError(LABEL, error, set))

  // [2.2] Auth guard: all users endpoints require authentication
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

  // [2.3] Delete a user
  .delete(
    "/:id",
    async ({ params }) => {
      // [2.3.1] Validate the id param
      const { id } = paramSchema.parse(params);
      // [2.3.2] Delete the user from the database
      const res = await service.delete(id);
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).deleted });
    },
    { detail: docs(LABEL).delete },
  )

  // [2.4] Get all users
  .get(
    "/",
    async () => {
      // [2.4.1] Fetch all users from the database
      const res = await service.getAll();
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).retrieved });
    },
    { detail: docs(LABEL).getAll },
  )

  // [2.5] Get a user by id
  .get(
    "/:id",
    async ({ params }) => {
      // [2.5.1] Validate the id param
      const { id } = paramSchema.parse(params);
      // [2.5.2] Fetch the user from the database
      const res = await service.getById(id);
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).retrieved });
    },
    { detail: docs(LABEL).getById },
  )

  // [2.6] Update a user
  .put(
    "/:id",
    async ({ body, params }) => {
      // [2.6.1] Validate the id param and request body
      const { id } = paramSchema.parse(params);
      const payload = payloadSchema.parse(body);
      // [2.6.2] Update the user in the database
      const res = await service.put(id, payload);
      return SUCCESS_RESPONSE({ data: res, message: responseMessage(LABEL).updated });
    },
    { detail: docs(LABEL).put },
  );
