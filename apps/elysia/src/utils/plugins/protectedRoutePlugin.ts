import Elysia from "elysia";

import { verifyAccessToken } from "@/src/utils/verifyAccessToken";

import { accessJwtPlugin } from "./jwtPlugin";

export const protectedRoutePlugin = (app: Elysia) =>
  app.use(accessJwtPlugin).onBeforeHandle(async ({ accessJwt, headers, set }) => {
    const res = await verifyAccessToken({ accessJwt, headers, set });
    return res ?? undefined;
  });
