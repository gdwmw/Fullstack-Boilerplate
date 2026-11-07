import Elysia from "elysia";

import { getAuthenticatedJWT } from "../auth";
import { accessJWTPlugin } from "./jwtPlugin";

export const protectedRoutePlugin = (app: Elysia) =>
  app.use(accessJWTPlugin).onBeforeHandle(async ({ accessJWT, headers, set }) => {
    const { error } = await getAuthenticatedJWT({ accessJWT, headers, set });
    return error ?? undefined;
  });
