import Elysia, { HTTPHeaders, StatusMap } from "elysia";

import { ERROR_RESPONSE, responseMessage, SUCCESS_RESPONSE } from "@/src/constants";
import { env } from "@/src/environment";
import { accessJwtPlugin, getBearerToken, handlePrismaError, refreshJwtPlugin, verifyAccessToken } from "@/src/utils";

import { changePasswordSchema, loginSchema, registerSchema } from "./schema";
import { service } from "./service";
import { docs } from "./swagger";

const LABEL = "authentication";

const REFRESH_COOKIE_NAME = env.JWT_REFRESH_COOKIE_NAME;
const REFRESH_COOKIE_PATH = env.JWT_REFRESH_COOKIE_PATH;
const REFRESH_COOKIE_SAME_SITE = env.JWT_REFRESH_COOKIE_SAME_SITE;
const REFRESH_COOKIE_SECURE = env.JWT_REFRESH_COOKIE_SECURE;

type THeadersMap = Record<string, string | undefined>;
type TJwtPayload = null | Record<string, unknown> | undefined;
interface IResponseSet {
  cookie?: Record<string, unknown>;
  headers: HTTPHeaders;
  redirect?: string;
  status?: keyof StatusMap | number;
}

const parseSubjectToUserId = (sub: unknown) => {
  if (typeof sub !== "string") return null;
  const userId = Number.parseInt(sub, 10);
  return Number.isNaN(userId) ? null : userId;
};

const parseJwtStringField = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : null);
const parseJwtExp = (value: unknown) => (typeof value === "number" ? value : null);

const readRefreshTokenFromCookie = (cookieHeader: string | undefined) => {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.split("=");
    if (key === REFRESH_COOKIE_NAME) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
};

const createRefreshCookie = (refreshToken: string) => {
  const maxAge = service.getRefreshTokenMaxAgeSeconds();
  const secure = REFRESH_COOKIE_SECURE ? "; Secure" : "";
  return `${REFRESH_COOKIE_NAME}=${encodeURIComponent(refreshToken)}; Path=${REFRESH_COOKIE_PATH}; HttpOnly; SameSite=${REFRESH_COOKIE_SAME_SITE}; Max-Age=${maxAge}${secure}`;
};

const clearRefreshCookie = () => {
  const secure = REFRESH_COOKIE_SECURE ? "; Secure" : "";
  return `${REFRESH_COOKIE_NAME}=; Path=${REFRESH_COOKIE_PATH}; HttpOnly; SameSite=${REFRESH_COOKIE_SAME_SITE}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`;
};

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
  userId: number;
}) => {
  const refreshJti = crypto.randomUUID();
  const accessToken = await accessJwt.sign({ jti: crypto.randomUUID(), sub: String(userId) });
  const refreshToken = await refreshJwt.sign({ jti: refreshJti, sub: String(userId) });
  return {
    accessToken,
    refreshToken,
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

  const bearerToken = getBearerToken(headers.authorization)!;
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

  .post(
    "/register",
    async ({ accessJwt, body, refreshJwt, set }) => {
      const payload = registerSchema.parse(body);
      const res = await service.register(payload);

      const tokens = await issueAccessAndRefreshTokens({ accessJwt, refreshJwt, userId: res.id });
      set.headers["set-cookie"] = createRefreshCookie(tokens.refreshToken);

      set.status = 201;

      return SUCCESS_RESPONSE({
        data: { ...res, accessToken: tokens.accessToken },
        message: responseMessage("register").success,
      });
    },

    { detail: docs(LABEL).register },
  )
  .post(
    "/login",
    async ({ accessJwt, body, refreshJwt, set }) => {
      const payload = loginSchema((body as { method: "email" | "username" }).method).parse(body);

      const res = await service.login(payload);

      if (!res) {
        set.status = 401;
        return ERROR_RESPONSE({
          message: payload.method === "email" ? responseMessage("email or password").invalid : responseMessage("username or password").invalid,
        });
      }

      const tokens = await issueAccessAndRefreshTokens({ accessJwt, refreshJwt, userId: res.id });
      set.headers["set-cookie"] = createRefreshCookie(tokens.refreshToken);

      return SUCCESS_RESPONSE({
        data: { ...res, accessToken: tokens.accessToken },
        message: responseMessage("login").success,
      });
    },

    { detail: docs(LABEL).login },
  )
  .post(
    "/refresh",
    async ({ accessJwt, headers, refreshJwt, set }) => {
      const cookieHeader = (headers as THeadersMap).cookie;
      const refreshToken = readRefreshTokenFromCookie(cookieHeader);

      if (!refreshToken) {
        set.headers["set-cookie"] = clearRefreshCookie();
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
        set.headers["set-cookie"] = clearRefreshCookie();
        set.status = 401;
        return ERROR_RESPONSE({
          message: responseMessage("refresh token").invalid + " or " + responseMessage("refresh token").expired,
        });
      }

      if (await service.isBlocklisted(refreshJti)) {
        set.headers["set-cookie"] = clearRefreshCookie();
        set.status = 401;
        return ERROR_RESPONSE({
          message: responseMessage("refresh token").invalid,
        });
      }

      const tokens = await issueAccessAndRefreshTokens({ accessJwt, refreshJwt, userId });

      const user = await service.getUserById(userId);

      if (!user) {
        set.headers["set-cookie"] = clearRefreshCookie();
        set.status = 404;
        return ERROR_RESPONSE({ message: responseMessage("users").notFound });
      }

      await service.addToBlocklist(refreshJti, new Date(refreshExp * 1000));
      set.headers["set-cookie"] = createRefreshCookie(tokens.refreshToken);

      return SUCCESS_RESPONSE({
        data: { ...user, accessToken: tokens.accessToken },
        message: responseMessage("token").updated,
      });
    },

    { detail: docs(LABEL).refresh },
  )
  .post(
    "/logout",
    async ({ accessJwt, headers, refreshJwt, set }) => {
      const cookieHeader = (headers as THeadersMap).cookie;
      const refreshToken = readRefreshTokenFromCookie(cookieHeader);

      if (refreshToken) {
        const decodedRefresh = await refreshJwt.verify(refreshToken);
        const refreshJti = parseJwtStringField((decodedRefresh as TJwtPayload)?.jti);
        const refreshExp = parseJwtExp((decodedRefresh as TJwtPayload)?.exp);

        if (refreshJti && refreshExp) {
          await service.addToBlocklist(refreshJti, new Date(refreshExp * 1000));
        }
      }

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

      set.headers["set-cookie"] = clearRefreshCookie();

      return SUCCESS_RESPONSE({ data: null, message: responseMessage("logout").success });
    },

    { detail: docs(LABEL).logout },
  )
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
