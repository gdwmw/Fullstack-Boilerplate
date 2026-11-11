import { changePasswordSchema, loginSchema, registerSchema } from "@repo/schemas";
import Elysia from "elysia";

import { responseMessage } from "@/src/constants/responseMessage";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "@/src/constants/responseTemplate";
import { Prisma } from "@/src/generated/prisma/client";
import { errorResponseMessage, generateAccessAndRefreshTokens, getAuthenticatedJWT } from "@/src/utils/auth";
import { accessJWTPlugin, refreshJWTPlugin } from "@/src/utils/plugins/jwtPlugin";

import { service } from "./service";
import { docs } from "./swagger";

const LABEL = "authentication";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(accessJWTPlugin)
  .use(refreshJWTPlugin)

  .get(
    "/me",
    async ({ accessJWT, headers, set }) => {
      const { error, jwt } = await getAuthenticatedJWT({ accessJWT, headers, set });

      if (error) {
        return error;
      }

      const res = await service.getUserById({ userId: jwt.sub });

      if (!res) {
        set.status = 404;
        return ERROR_RESPONSE({ message: responseMessage("users").notFound });
      }

      return SUCCESS_RESPONSE({ data: res, message: responseMessage("users").retrieved });
    },

    { detail: docs(LABEL).me },
  )

  .post(
    "/register",
    async ({ accessJWT, body, refreshJWT, set }) => {
      const payload = registerSchema.parse(body);

      try {
        const res = await service.register({ payload });

        const tokens = await generateAccessAndRefreshTokens({ accessJWT, refreshJWT, userId: res.id });

        return SUCCESS_RESPONSE({
          data: { ...res, accessToken: tokens.accessToken, refreshToken: tokens.encryptedRefreshToken },
          message: responseMessage("register").success,
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002") {
            set.status = 409;

            const extractFieldName = (message: string): string => {
              const split = message.split("\n");
              const lastLine = split.at(-1);
              const field = lastLine?.match(/`([^`]+)`/)?.[1];
              return (
                field
                  ?.replaceAll("_", " ")
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ") || "[failed to extract field name from error message]"
              );
            };

            return ERROR_RESPONSE({
              message: `${responseMessage(extractFieldName(error.message)).alreadyExists}`,
            });
          }
        }
      }
    },

    { detail: docs(LABEL).register },
  )

  .post(
    "/login",
    async ({ accessJWT, body, refreshJWT, set }) => {
      const prePayload = body as { method: "email" | "username" };

      const payload = loginSchema(prePayload.method).parse(body);

      const res = await service.login({ payload });

      if (!res) {
        set.status = 401;
        return ERROR_RESPONSE({
          message: payload.method === "email" ? responseMessage("email or password").invalid : responseMessage("username or password").invalid,
        });
      }

      const tokens = await generateAccessAndRefreshTokens({ accessJWT, refreshJWT, userId: res.id });

      return SUCCESS_RESPONSE({
        data: { ...res, accessToken: tokens.accessToken, refreshToken: tokens.encryptedRefreshToken },
        message: responseMessage("login").success,
      });
    },

    { detail: docs(LABEL).login },
  )

  .post(
    "/refresh",
    async ({ accessJWT, body, refreshJWT, set }) => {
      const payload = body as { refreshToken: string };

      if (!payload.refreshToken) {
        set.status = 401;
        return ERROR_RESPONSE({
          message: responseMessage("refresh token").required,
        });
      }

      const decoded = await refreshJWT.verify(payload.refreshToken);

      if (
        !decoded ||
        typeof decoded !== "object" ||
        typeof decoded.sub !== "string" ||
        typeof decoded.jti !== "string" ||
        typeof decoded.exp !== "number" ||
        !Number.isFinite(decoded.exp)
      ) {
        set.status = 401;
        return ERROR_RESPONSE({
          message: errorResponseMessage,
        });
      }

      const isRefreshTokenBlocked = await service.isRefreshTokenBlocked(decoded.jti);

      if (isRefreshTokenBlocked) {
        set.status = 401;
        return ERROR_RESPONSE({
          message: responseMessage("refresh token").invalid,
        });
      }

      const tokens = await generateAccessAndRefreshTokens({ accessJWT, refreshJWT, userId: decoded.sub });

      const user = await service.getUserById({ userId: decoded.sub });

      if (!user) {
        set.status = 404;
        return ERROR_RESPONSE({ message: responseMessage("users").notFound });
      }

      const refreshExpiresAt = new Date(decoded.exp * 1000);
      await service.addToBlocklist(decoded.jti, refreshExpiresAt);

      return SUCCESS_RESPONSE({
        data: { ...user, accessToken: tokens.accessToken, refreshToken: tokens.encryptedRefreshToken },
        message: responseMessage("token").updated,
      });
    },

    { detail: docs(LABEL).refresh },
  )

  .post(
    "/logout",
    async ({ accessJWT, headers, set }) => {
      const { error, jwt } = await getAuthenticatedJWT({ accessJWT, headers, set });

      if (error) {
        return error;
      }

      const expiresAt = new Date(jwt.exp * 1000);
      await service.addToBlocklist(jwt.jti, expiresAt);

      return SUCCESS_RESPONSE({ data: null, message: responseMessage("logout").success });
    },

    { detail: docs(LABEL).logout },
  )

  .post(
    "/change-password",
    async ({ accessJWT, body, headers, set }) => {
      const { error, jwt } = await getAuthenticatedJWT({ accessJWT, headers, set });

      if (error) {
        return error;
      }

      const payload = changePasswordSchema.parse(body);

      const res = await service.changePassword({ payload, userId: jwt.sub });

      if (!res) {
        set.status = 401;
        return ERROR_RESPONSE({ message: responseMessage("current password").invalid });
      }

      return SUCCESS_RESPONSE({ data: res, message: responseMessage("password").updated });
    },

    { detail: docs(LABEL).changePassword },
  );
