import Elysia from "elysia";

import { handlePrismaError } from "@/src/utils/handle-prisma-error";
import { verifyAccessToken } from "@/src/utils/verifyAccessToken";

import { accessJwtPlugin } from "./jwtPlugin";

export const protectedRoutePlugin = (label: string) =>
  new Elysia()
    .use(accessJwtPlugin)
    .onError(({ error, set }) => handlePrismaError(label, error, set))
    .onBeforeHandle(async ({ accessJwt, headers, set }) => (await verifyAccessToken({ accessJwt, headers, set })) ?? undefined);
