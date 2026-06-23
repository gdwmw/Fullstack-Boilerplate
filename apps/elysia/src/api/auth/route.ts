import { changePasswordSchema, loginSchema, registerSchema } from "@repo/schemas";
import { encryptToken } from "@repo/utils";
import Elysia, { HTTPHeaders, StatusMap } from "elysia";

import { responseMessage } from "@/src/constants/responseMessage";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "@/src/constants/responseTemplate";
import { env } from "@/src/environment";
import { handlePrismaError } from "@/src/utils/handle-prisma-error/handlePrismaError";
import { accessJwtPlugin, refreshJwtPlugin } from "@/src/utils/plugins/jwtPlugin";
import { getBearerToken, verifyAccessToken } from "@/src/utils/verifyAccessToken";

import { service } from "./service";
import { docs } from "./swagger";

const LABEL = "authentication";

const REFRESH_TOKEN_COOKIE_SECRET = env.REFRESH_TOKEN_COOKIE_SECRET;

type TJwtPayload = null | Record<string, unknown> | undefined;
interface IResponseSet {
  cookie?: Record<string, unknown>;
  headers: HTTPHeaders;
  redirect?: string;
  status?: keyof StatusMap | number;
}

const parseSubjectToUserId = (sub: unknown) => {
  if (typeof sub !== "string" || sub.length === 0) return null;
  return sub;
};

const parseLoginMethod = (body: unknown): "email" | "username" => {
  if (!body || typeof body !== "object" || !("method" in body)) {
    return "username";
  }

  const method = (body as { method?: unknown }).method;
  return method === "email" ? "email" : "username";
};

const parseJwtStringField = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : null);
const parseJwtExp = (value: unknown) => (typeof value === "number" ? value : null);

const issueAccessAndRefreshTokens = async ({
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
  const refreshJti = crypto.randomUUID();
  const accessToken = await accessJwt.sign({ jti: crypto.randomUUID(), sub: String(userId) });
  const refreshToken = await refreshJwt.sign({ jti: refreshJti, sub: String(userId) });
  const encryptedRefreshToken = await encryptToken(refreshToken, REFRESH_TOKEN_COOKIE_SECRET);
  return {
    accessToken,
    encryptedRefreshToken,
  };
};

const getAuthenticatedUserId = async ({
  accessJwt,
  headers,
  set,
}: {
  accessJwt: { verify(token: string): Promise<unknown> };
  headers: { authorization?: string };
  set: IResponseSet;
}) => {
  const verifyResponse = await verifyAccessToken({ accessJwt, headers, set });

  if (verifyResponse) {
    return { error: verifyResponse, userId: null };
  }

  const bearerToken = getBearerToken(headers.authorization);

  if (!bearerToken) {
    set.status = 401;
    return {
      error: ERROR_RESPONSE({ message: responseMessage("access token").required }),
      userId: null,
    };
  }

  const decoded = await accessJwt.verify(bearerToken);
  const sub = decoded && typeof decoded === "object" && "sub" in decoded ? decoded.sub : undefined;
  const userId = parseSubjectToUserId(sub);

  if (!userId) {
    return {
      error: ERROR_RESPONSE({
        message: responseMessage("access token").invalid,
      }),
      userId: null,
    };
  }

  return { error: null, userId };
};

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(accessJwtPlugin)
  .use(refreshJwtPlugin)
  .onError(({ error, set }) => handlePrismaError(LABEL, error, set))

  .get(
    "/me",
    async ({ accessJwt, headers, set }) => {
      const auth = await getAuthenticatedUserId({ accessJwt, headers, set });
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
      const res = await service.register(payload);

      const tokens = await issueAccessAndRefreshTokens({ accessJwt, refreshJwt, userId: res.id });

      set.status = 201;

      return SUCCESS_RESPONSE({
        data: { ...res, accessToken: tokens.accessToken, refreshToken: tokens.encryptedRefreshToken },
        message: responseMessage("register").success,
      });
    },

    { detail: docs(LABEL).register },
  )

  .post(
    "/login",
    async ({ accessJwt, body, refreshJwt, set }) => {
      const payload = loginSchema(parseLoginMethod(body)).parse(body);

      const res = await service.login(payload);

      if (!res) {
        set.status = 401;
        return ERROR_RESPONSE({
          message: payload.method === "email" ? responseMessage("email or password").invalid : responseMessage("username or password").invalid,
        });
      }

      const tokens = await issueAccessAndRefreshTokens({ accessJwt, refreshJwt, userId: res.id });

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
      const bodyToken = (body as { refreshToken?: string } | null)?.refreshToken;
      const refreshToken = typeof bodyToken === "string" && bodyToken.length > 0 ? bodyToken : null;

      if (!refreshToken) {
        set.status = 401;
        return ERROR_RESPONSE({
          message: responseMessage("refresh token").required,
        });
      }

      const decoded = await refreshJwt.verify(refreshToken);
      const userId = parseSubjectToUserId((decoded as TJwtPayload)?.sub);
      const refreshJti = parseJwtStringField((decoded as TJwtPayload)?.jti);
      const refreshExp = parseJwtExp((decoded as TJwtPayload)?.exp);

      if (!decoded || !userId || !refreshJti || !refreshExp) {
        set.status = 401;
        return ERROR_RESPONSE({
          message: `${responseMessage("refresh token").invalid} or ${responseMessage("refresh token").expired}`,
        });
      }

      if (await service.isBlocklisted(refreshJti)) {
        set.status = 401;
        return ERROR_RESPONSE({
          message: responseMessage("refresh token").invalid,
        });
      }

      const tokens = await issueAccessAndRefreshTokens({ accessJwt, refreshJwt, userId });

      const user = await service.getUserById(userId);

      if (!user) {
        set.status = 404;
        return ERROR_RESPONSE({ message: responseMessage("users").notFound });
      }

      await service.addToBlocklist(refreshJti, new Date(refreshExp * 1000));

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
      const authorization = headers.authorization;
      const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;

      if (bearerToken) {
        const decodedAccess = await accessJwt.verify(bearerToken);

        if (
          decodedAccess &&
          typeof decodedAccess === "object" &&
          "jti" in decodedAccess &&
          typeof decodedAccess.jti === "string" &&
          "exp" in decodedAccess &&
          typeof decodedAccess.exp === "number"
        ) {
          await service.addToBlocklist(decodedAccess.jti, new Date(decodedAccess.exp * 1000));
        }
      }

      return SUCCESS_RESPONSE({ data: null, message: responseMessage("logout").success });
    },

    { detail: docs(LABEL).logout },
  )

  .post(
    "/change-password",
    async ({ accessJwt, body, headers, set }) => {
      const auth = await getAuthenticatedUserId({ accessJwt, headers, set });
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
