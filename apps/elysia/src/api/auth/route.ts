import { changePasswordSchema, loginSchema, registerSchema } from "@repo/schemas";
import { encryptToken } from "@repo/utils";
import Elysia, { HTTPHeaders, StatusMap } from "elysia";

import { responseMessage } from "@/src/constants/responseMessage";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "@/src/constants/responseTemplate";
import { env } from "@/src/environment";
import { Prisma } from "@/src/generated/prisma/client";
import { accessJwtPlugin, refreshJwtPlugin } from "@/src/utils/plugins/jwtPlugin";
import { getBearerToken, verifyAccessToken } from "@/src/utils/verifyAccessToken";

import { service } from "./service";
import { docs } from "./swagger";

const LABEL = "authentication";

const REFRESH_TOKEN_COOKIE_SECRET = env.REFRESH_TOKEN_COOKIE_SECRET;

interface IResponseSet {
  cookie?: Record<string, unknown>;
  headers: HTTPHeaders;
  redirect?: string;
  status?: keyof StatusMap | number;
}

const parseSubjectToUserId = (sub: unknown) => {
  if (typeof sub !== "string" || sub.length === 0) {
    return null;
  }

  return sub;
};

const generateAccessAndRefreshTokens = async ({
  accessJwt,
  refreshJwt,
  userId,
}: {
  accessJwt: { sign(payload: { jti: string; sub: string }): Promise<string> };
  refreshJwt: {
    sign(payload: { jti: string; sub: string }): Promise<string>;
    verify(token: string): Promise<unknown>;
  };
  userId: string;
}) => {
  const subject = String(userId);
  const accessJti = crypto.randomUUID();
  const refreshJti = crypto.randomUUID();

  const accessToken = await accessJwt.sign({
    jti: accessJti,
    sub: subject,
  });

  const refreshToken = await refreshJwt.sign({
    jti: refreshJti,
    sub: subject,
  });

  const encryptedRefreshToken = await encryptToken(refreshToken, REFRESH_TOKEN_COOKIE_SECRET);

  return {
    accessToken,
    encryptedRefreshToken,
  };
};

const getUserIdFromAccessToken = async ({
  accessJwt,
  headers,
  set,
}: {
  accessJwt: { verify(token: string): Promise<unknown> };
  headers: { authorization?: string };
  set: IResponseSet;
}) => {
  const verificationError = await verifyAccessToken({ accessJwt, headers, set });

  if (verificationError) {
    return {
      error: verificationError,
      userId: null,
    };
  }

  const bearerToken = getBearerToken(headers.authorization);

  if (!bearerToken) {
    set.status = 401;

    return {
      error: ERROR_RESPONSE({ message: responseMessage("access token").required }),
      userId: null,
    };
  }

  const decodedPayload = await accessJwt.verify(bearerToken);
  const subject = decodedPayload && typeof decodedPayload === "object" && "sub" in decodedPayload ? decodedPayload.sub : undefined;
  const userId = parseSubjectToUserId(subject);

  if (!userId) {
    return {
      error: ERROR_RESPONSE({
        message: responseMessage("access token").invalid,
      }),
      userId: null,
    };
  }

  return {
    error: null,
    userId,
  };
};

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(accessJwtPlugin)
  .use(refreshJwtPlugin)

  .get(
    "/me",
    async ({ accessJwt, headers, set }) => {
      const auth = await getUserIdFromAccessToken({ accessJwt, headers, set });

      if (auth.error) {
        set.status = 401;
        return auth.error;
      }

      const res = await service.getUserById(auth.userId);

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
    async ({ accessJwt, body, refreshJwt, set }) => {
      const payload = registerSchema.parse(body);

      try {
        const res = await service.register(payload);

        const tokens = await generateAccessAndRefreshTokens({ accessJwt, refreshJwt, userId: res.id });

        set.status = 201;

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
    async ({ accessJwt, body, refreshJwt, set }) => {
      const parseLoginMethod = (body: unknown): "email" | "username" => {
        if (!body || typeof body !== "object" || !("method" in body)) {
          return "username";
        }

        return body.method === "email" ? "email" : "username";
      };

      const payload = loginSchema(parseLoginMethod(body)).parse(body);

      const res = await service.login(payload);

      if (!res) {
        set.status = 401;
        return ERROR_RESPONSE({
          message: payload.method === "email" ? responseMessage("email or password").invalid : responseMessage("username or password").invalid,
        });
      }

      const tokens = await generateAccessAndRefreshTokens({ accessJwt, refreshJwt, userId: res.id });

      return SUCCESS_RESPONSE({
        data: { ...res, accessToken: tokens.accessToken, refreshToken: tokens.encryptedRefreshToken },
        message: responseMessage("login").success,
      });
    },

    { detail: docs(LABEL).login },
  )

  .post(
    "/refresh",
    async ({ accessJwt, body, refreshJwt, set }) => {
      const bodyRefreshToken = (body as { refreshToken?: unknown } | null)?.refreshToken;
      const refreshToken = typeof bodyRefreshToken === "string" && bodyRefreshToken.length > 0 ? bodyRefreshToken : null;

      if (!refreshToken) {
        set.status = 401;
        return ERROR_RESPONSE({
          message: responseMessage("refresh token").required,
        });
      }

      const decodedPayload = await refreshJwt.verify(refreshToken);
      const tokenClaims = decodedPayload && typeof decodedPayload === "object" ? (decodedPayload as Record<string, unknown>) : null;

      const userId = parseSubjectToUserId(tokenClaims?.sub);

      const parseJwtStringField = (value: unknown) => {
        if (typeof value !== "string" || value.length === 0) {
          return null;
        }

        return value;
      };

      const refreshJti = parseJwtStringField(tokenClaims?.jti);

      const parseJwtExp = (value: unknown) => {
        if (typeof value !== "number") {
          return null;
        }

        return value;
      };

      const refreshExp = parseJwtExp(tokenClaims?.exp);

      if (!tokenClaims || !userId || !refreshJti || !refreshExp) {
        set.status = 401;
        return ERROR_RESPONSE({
          message: `${responseMessage("refresh token").invalid} or ${responseMessage("refresh token").expired}`,
        });
      }

      const isRefreshTokenBlocklisted = await service.isBlocklisted(refreshJti);

      if (isRefreshTokenBlocklisted) {
        set.status = 401;
        return ERROR_RESPONSE({
          message: responseMessage("refresh token").invalid,
        });
      }

      const tokens = await generateAccessAndRefreshTokens({ accessJwt, refreshJwt, userId });

      const user = await service.getUserById(userId);

      if (!user) {
        set.status = 404;
        return ERROR_RESPONSE({ message: responseMessage("users").notFound });
      }

      const refreshExpiresAt = new Date(refreshExp * 1000);
      await service.addToBlocklist(refreshJti, refreshExpiresAt);

      return SUCCESS_RESPONSE({
        data: { ...user, accessToken: tokens.accessToken, refreshToken: tokens.encryptedRefreshToken },
        message: responseMessage("token").updated,
      });
    },

    { detail: docs(LABEL).refresh },
  )

  .post(
    "/logout",
    async ({ accessJwt, headers }) => {
      const accessToken = getBearerToken(headers.authorization);

      if (accessToken) {
        const decodedPayload = await accessJwt.verify(accessToken);
        const tokenClaims = decodedPayload && typeof decodedPayload === "object" ? (decodedPayload as Record<string, unknown>) : null;
        const tokenId = tokenClaims?.jti;
        const expirationTime = tokenClaims?.exp;

        if (typeof tokenId === "string" && typeof expirationTime === "number") {
          const expiresAt = new Date(expirationTime * 1000);
          await service.addToBlocklist(tokenId, expiresAt);
        }
      }

      return SUCCESS_RESPONSE({ data: null, message: responseMessage("logout").success });
    },

    { detail: docs(LABEL).logout },
  )

  .post(
    "/change-password",
    async ({ accessJwt, body, headers, set }) => {
      const auth = await getUserIdFromAccessToken({ accessJwt, headers, set });
      if (auth.error) {
        set.status = 401;
        return auth.error;
      }

      const payload = changePasswordSchema.parse(body);

      const res = await service.changePassword(auth.userId, payload);

      if (!res) {
        set.status = 401;
        return ERROR_RESPONSE({ message: responseMessage("current password").invalid });
      }

      return SUCCESS_RESPONSE({ data: res, message: responseMessage("password").updated });
    },

    { detail: docs(LABEL).changePassword },
  );
