import Elysia from "elysia";

import { handlePrismaError, verifyAccessToken } from "@/src/utils";

import { accessJwtPlugin } from "./jwtPlugin";

export const protectedRoutePlugin = (label: string) =>
  new Elysia()
    .use(accessJwtPlugin)
    .onError(({ error, set }) => handlePrismaError(label, error, set))
    .onBeforeHandle(async ({ accessJwt, headers, set }) => (await verifyAccessToken({ accessJwt, headers, set })) ?? undefined);
