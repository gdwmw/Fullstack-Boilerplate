import { jwt } from "@elysiajs/jwt";
import Elysia from "elysia";

import { ERROR_RESPONSE, responseMessage, SUCCESS_RESPONSE } from "@/src/constants";
import { getBearerToken, handlePrismaError, verifyAccessToken } from "@/src/utils";

import { changePasswordSchema, loginSchema, refreshSchema, registerSchema } from "./schema";
import { service } from "./service";
import { docs } from "./swagger";

const LABEL = "Authentication";

const parseSubjectToUserId = (sub: unknown) => {
  if (typeof sub !== "string") return null;

  const userId = Number.parseInt(sub, 10);
  return Number.isNaN(userId) ? null : userId;
};

export const AuthRoutes = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      exp: process.env.JWT_ACCESS_EXPIRES_IN || "30m",
      name: "jwt",
      secret: process.env.JWT_ACCESS_SECRET || "",
    }),
  )

  .use(
    jwt({
      exp: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
      name: "refreshJwt",
      secret: process.env.JWT_REFRESH_SECRET || "",
    }),
  )

  .onError(({ error, set }) => handlePrismaError(LABEL, error, set))

  .post(
    "/register",
    async ({ body, jwt, refreshJwt, set }) => {
      const payload = registerSchema.parse(body);
      const res = await service.register(payload);

      const accessToken = await jwt.sign({
        jti: crypto.randomUUID(),
        sub: String(res.id),
      });

      const refreshToken = await refreshJwt.sign({
        jti: crypto.randomUUID(),
        sub: String(res.id),
      });

      set.status = 201;

      return SUCCESS_RESPONSE({ ...res, accessToken, refreshToken }, responseMessage("Register").success);
    },

    { detail: docs(LABEL).register },
  )

  .post(
    "/login",
    async ({ body, jwt, refreshJwt, set }) => {
      const payload = loginSchema((body as { method: "email" | "username" }).method).parse(body);
      const res = await service.login(payload);

      if (!res) {
        set.status = 401;
        return ERROR_RESPONSE(
          null,
          payload.method === "email" ? responseMessage("Email or Password").invalid : responseMessage("Username or Password").invalid,
        );
      }

      const accessToken = await jwt.sign({
        jti: crypto.randomUUID(),
        sub: String(res.id),
      });

      const refreshToken = await refreshJwt.sign({
        jti: crypto.randomUUID(),
        sub: String(res.id),
      });

      return SUCCESS_RESPONSE({ ...res, accessToken, refreshToken }, responseMessage("Login").success);
    },

    { detail: docs(LABEL).login },
  )

  .post(
    "/refresh",
    async ({ body, jwt, refreshJwt, set }) => {
      const payload = refreshSchema.parse(body);
      const decoded = await refreshJwt.verify(payload.refreshToken);
      const userId = parseSubjectToUserId(decoded?.sub);

      if (!decoded || !userId) {
        set.status = 401;
        return ERROR_RESPONSE(null, responseMessage("Refresh token").invalid + " or " + responseMessage("Refresh token").expired);
      }

      if (decoded.jti && (await service.isBlocklisted(decoded.jti))) {
        set.status = 401;
        return ERROR_RESPONSE(null, responseMessage("Refresh token").invalid);
      }

      const user = await service.getUserById(userId);

      if (!user) {
        set.status = 404;
        return ERROR_RESPONSE(null, responseMessage("Users").notFound);
      }

      if (decoded.jti && decoded.exp) {
        await service.addToBlocklist(decoded.jti, new Date(decoded.exp * 1000));
      }

      const accessToken = await jwt.sign({
        jti: crypto.randomUUID(),
        sub: String(user.id),
      });

      const refreshToken = await refreshJwt.sign({
        jti: crypto.randomUUID(),
        sub: String(user.id),
      });

      return SUCCESS_RESPONSE({ accessToken, refreshToken }, responseMessage("Token").updated);
    },

    { detail: docs(LABEL).refresh },
  )

  .post(
    "/logout",
    async ({ body, headers, jwt, refreshJwt }) => {
      const payload = refreshSchema.parse(body);

      const decodedRefresh = await refreshJwt.verify(payload.refreshToken);
      if (decodedRefresh?.jti && decodedRefresh.exp) {
        await service.addToBlocklist(decodedRefresh.jti, new Date(decodedRefresh.exp * 1000));
      }

      const authorization = headers.authorization;
      const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;

      if (bearerToken) {
        const decodedAccess = await jwt.verify(bearerToken);
        if (decodedAccess?.jti && decodedAccess.exp) {
          await service.addToBlocklist(decodedAccess.jti, new Date(decodedAccess.exp * 1000));
        }
      }

      return SUCCESS_RESPONSE(null, responseMessage("Logout").success);
    },

    { detail: docs(LABEL).logout },
  )

  .get(
    "/me",
    async ({ headers, jwt, set }) => {
      const verifyResponse = await verifyAccessToken({ headers, jwt, set });
      if (verifyResponse) return verifyResponse;

      const bearerToken = getBearerToken(headers.authorization)!;
      const decoded = await jwt.verify(bearerToken);
      const userId = parseSubjectToUserId(decoded?.sub);

      if (!userId) {
        set.status = 401;
        return ERROR_RESPONSE(null, responseMessage("Access token").invalid);
      }

      const res = await service.getUserById(userId);

      if (!res) {
        set.status = 404;
        return ERROR_RESPONSE(null, responseMessage("Users").notFound);
      }

      return SUCCESS_RESPONSE(res, responseMessage("Users").retrieved);
    },

    { detail: docs(LABEL).me },
  )

  .post(
    "/change-password",
    async ({ body, headers, jwt, set }) => {
      const verifyResponse = await verifyAccessToken({ headers, jwt, set });
      if (verifyResponse) return verifyResponse;

      const bearerToken = getBearerToken(headers.authorization)!;
      const decoded = await jwt.verify(bearerToken);
      const userId = parseSubjectToUserId(decoded?.sub);

      if (!userId) {
        set.status = 401;
        return ERROR_RESPONSE(null, responseMessage("Access token").invalid);
      }

      const payload = changePasswordSchema.parse(body);
      const res = await service.changePassword(userId, payload);

      if (!res) {
        set.status = 401;
        return ERROR_RESPONSE(null, responseMessage("Current password").invalid);
      }

      return SUCCESS_RESPONSE(res, responseMessage("Password").updated);
    },

    { detail: docs(LABEL).changePassword },
  );
