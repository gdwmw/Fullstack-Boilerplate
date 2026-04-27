import { jwt } from "@elysiajs/jwt";
import Elysia from "elysia";

import { ERROR_RESPONSE, responseMessage, SUCCESS_RESPONSE } from "@/src/constants";
import { handlePrismaError } from "@/src/utils";

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
      exp: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
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
        sub: String(res.id),
      });

      const refreshToken = await refreshJwt.sign({
        sub: String(res.id),
      });

      await service.saveRefreshToken(res.id, refreshToken);

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
        sub: String(res.id),
      });

      const refreshToken = await refreshJwt.sign({
        sub: String(res.id),
      });

      await service.saveRefreshToken(res.id, refreshToken);

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
        return ERROR_RESPONSE(null, responseMessage("Refresh token").invalid);
      }

      const res = await service.validateRefreshToken(userId, payload.refreshToken);

      if (!res) {
        set.status = 401;
        return ERROR_RESPONSE(null, responseMessage("Refresh token").invalid + " or " + responseMessage("Refresh token").expired);
      }

      const accessToken = await jwt.sign({
        sub: String(res.id),
      });

      const newRefreshToken = await refreshJwt.sign({
        sub: String(res.id),
      });

      await service.saveRefreshToken(res.id, newRefreshToken);

      return SUCCESS_RESPONSE({ accessToken, refreshToken: newRefreshToken }, responseMessage("Token").updated);
    },

    { detail: docs(LABEL).refresh },
  )

  .post(
    "/logout",
    async ({ body, refreshJwt, set }) => {
      const payload = refreshSchema.parse(body);
      const decoded = await refreshJwt.verify(payload.refreshToken);
      const userId = parseSubjectToUserId(decoded?.sub);

      if (!decoded || !userId) {
        set.status = 401;
        return ERROR_RESPONSE(null, responseMessage("Refresh token").invalid);
      }

      const res = await service.validateRefreshToken(userId, payload.refreshToken);

      if (!res) {
        set.status = 401;
        return ERROR_RESPONSE(null, responseMessage("Refresh token").invalid + " or " + responseMessage("Refresh token").expired);
      }

      await service.revokeRefreshToken(res.id);

      return SUCCESS_RESPONSE(null, responseMessage("Logout").success);
    },

    { detail: docs(LABEL).logout },
  )

  .get(
    "/me",
    async ({ headers, jwt, set }) => {
      const authorization = headers.authorization;
      const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;

      if (!bearerToken) {
        set.status = 401;
        return ERROR_RESPONSE(null, responseMessage("Access token").required);
      }

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
      const authorization = headers.authorization;
      const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;

      if (!bearerToken) {
        set.status = 401;
        return ERROR_RESPONSE(null, responseMessage("Access token").required);
      }

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
