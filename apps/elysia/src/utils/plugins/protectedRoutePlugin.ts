import Elysia from "elysia";

import { getAuthenticatedJWT, IAuthenticatedJWT } from "../auth";
import { accessJWTPlugin } from "./jwtPlugin";

export const protectedRoutePlugin = (app: Elysia) =>
  app
    .use(accessJWTPlugin)
    .decorate("authJWT", undefined as unknown as IAuthenticatedJWT)
    .onBeforeHandle(async (context) => {
      const { error, jwt } = await getAuthenticatedJWT({
        accessJWT: context.accessJWT,
        headers: context.headers,
        set: context.set,
      });

      if (error) {
        return error;
      }

      context.authJWT = jwt;

      return undefined;
    });
