import Elysia, { HTTPHeaders, StatusMap } from "elysia";
import { ElysiaCookie } from "elysia/dist/cookies";

import { ERROR_RESPONSE, responseMessage, SUCCESS_RESPONSE } from "@/src/constants";
import { accessJwtPlugin, refreshJwtPlugin } from "@/src/libs";
import { getBearerToken, handlePrismaError, verifyAccessToken } from "@/src/utils";

import { changePasswordSchema, loginSchema, registerSchema } from "./schema";
import { service } from "./service";
import { docs } from "./swagger";

// ---------------------------------------------------------------------------
// [1] Constants & local types
// Defines the route label, cookie name, and local helper types.
// ---------------------------------------------------------------------------

const LABEL = "authentication";
const REFRESH_COOKIE_NAME = process.env.JWT_REFRESH_COOKIE_NAME || "refreshToken";
const REFRESH_COOKIE_PATH = process.env.JWT_REFRESH_COOKIE_PATH || "/auth";
const REFRESH_COOKIE_SAME_SITE = process.env.JWT_REFRESH_COOKIE_SAME_SITE || "Lax";
const REFRESH_COOKIE_SECURE = process.env.JWT_REFRESH_COOKIE_SECURE !== "false";

type THeadersMap = Record<string, string | undefined>;
type TJwtPayload = null | Record<string, unknown> | undefined;
interface IResponseSet {
  cookie?: Record<string, ElysiaCookie>;
  headers: HTTPHeaders;
  redirect?: string;
  status?: keyof StatusMap | number;
}

// ---------------------------------------------------------------------------
// [2] JWT payload helpers
// Reads important fields from the JWT payload with defensive parsing.
// ---------------------------------------------------------------------------

const parseSubjectToUserId = (sub: unknown) => {
  if (typeof sub !== "string") return null;

  const userId = Number.parseInt(sub, 10);
  return Number.isNaN(userId) ? null : userId;
};

const parseJwtStringField = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : null);
const parseJwtExp = (value: unknown) => (typeof value === "number" ? value : null);

// ---------------------------------------------------------------------------
// [3] Refresh cookie helpers
// Reads, creates, and clears the refresh token cookie.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// [4] Request helpers
// Extracts request metadata that will be stored in the refresh session.
// ---------------------------------------------------------------------------

const getClientMetadata = (headers: THeadersMap) => {
  const rawIp = headers["x-forwarded-for"] || headers["x-real-ip"];
  const ipAddress = rawIp?.split(",")[0]?.trim();

  return {
    ipAddress: ipAddress && ipAddress.length > 0 ? ipAddress : undefined,
    userAgent: headers["user-agent"] || undefined,
  };
};

// ---------------------------------------------------------------------------
// [5] JWT & auth guard helpers
// Shared helpers to issue tokens and extract the user id from the access token.
// ---------------------------------------------------------------------------

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
  const accessJti = crypto.randomUUID();
  const refreshJti = crypto.randomUUID();

  const accessToken = await accessJwt.sign({ jti: accessJti, sub: String(userId) });
  const refreshToken = await refreshJwt.sign({ jti: refreshJti, sub: String(userId) });
  const decodedRefresh = await refreshJwt.verify(refreshToken);
  const exp = parseJwtExp((decodedRefresh as null | Record<string, unknown> | undefined)?.exp);

  if (!exp) {
    throw new Error("failed to parse refresh token expiration");
  }

  return {
    accessJti,
    accessToken,
    expiresAt: new Date(exp * 1000),
    refreshJti,
    refreshToken,
  };
};

const getAuthenticatedUserId = async ({
  accessJwt,
  headers,
  set,
}: {
  accessJwt: { verify(token: string): Promise<TJwtPayload> };
  headers: { authorization?: string };
  set: IResponseSet;
}) => {
  const verifyResponse = await verifyAccessToken({ accessJwt, headers, set });
  if (verifyResponse) {
    return { error: verifyResponse, userId: null };
  }

  const bearerToken = getBearerToken(headers.authorization)!;
  const decoded = await accessJwt.verify(bearerToken);
  const userId = parseSubjectToUserId(decoded?.sub);

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

// ---------------------------------------------------------------------------
// [6] Routes
// Auth endpoints start here. The numbered comments are also referenced by the README.
// ---------------------------------------------------------------------------

export const AuthRoutes = new Elysia({ prefix: "/auth" })
  .use(accessJwtPlugin)
  .use(refreshJwtPlugin)

  .onError(({ error, set }) => handlePrismaError(LABEL, error, set))

  // ----- [6.1] /register -----
  // Flow: validate body -> create user -> issue tokens -> persist session -> set cookie -> return response.
  .post(
    "/register",
    async ({ accessJwt, body, headers, refreshJwt, set }) => {
      // [6.1.1] Validate the register payload, then create a new user.
      const payload = registerSchema.parse(body);
      const res = await service.register(payload);

      // [6.1.2] Create an access/refresh token pair for the new user.
      const tokens = await issueAccessAndRefreshTokens({ accessJwt, refreshJwt, userId: res.id });

      // [6.1.3] Extract request metadata, then persist the refresh session to the database.
      const clientMetadata = getClientMetadata(headers as THeadersMap);

      await service.createRefreshSession({
        expiresAt: tokens.expiresAt,
        familyId: crypto.randomUUID(),
        ipAddress: clientMetadata.ipAddress,
        jti: tokens.refreshJti,
        token: tokens.refreshToken,
        userAgent: clientMetadata.userAgent,
        userId: res.id,
      });

      // [6.1.4] Write the refresh token to an HttpOnly cookie so the client never holds it in JS runtime.
      set.headers["set-cookie"] = createRefreshCookie(tokens.refreshToken);

      set.status = 201;

      // [6.1.5] Return the user data and access token to the client.
      return SUCCESS_RESPONSE({
        data: { ...res, accessToken: tokens.accessToken },
        message: responseMessage("register").success,
      });
    },

    { detail: docs(LABEL).register },
  )

  // ----- [6.2] /login -----
  // Flow: validate login -> verify user -> issue tokens -> persist session -> set cookie -> return response.
  .post(
    "/login",
    async ({ accessJwt, body, headers, refreshJwt, set }) => {
      // [6.2.1] Validate the payload based on the login method: email or username.
      const payload = loginSchema((body as { method: "email" | "username" }).method).parse(body);

      // [6.2.2] Verify the user credentials in the service layer.
      const res = await service.login(payload);

      if (!res) {
        set.status = 401;
        return ERROR_RESPONSE({
          message: payload.method === "email" ? responseMessage("email or password").invalid : responseMessage("username or password").invalid,
        });
      }

      // [6.2.3] If valid, issue a new token pair.
      const tokens = await issueAccessAndRefreshTokens({ accessJwt, refreshJwt, userId: res.id });

      // [6.2.4] Persist the new refresh session along with client metadata.
      const clientMetadata = getClientMetadata(headers as THeadersMap);

      await service.createRefreshSession({
        expiresAt: tokens.expiresAt,
        familyId: crypto.randomUUID(),
        ipAddress: clientMetadata.ipAddress,
        jti: tokens.refreshJti,
        token: tokens.refreshToken,
        userAgent: clientMetadata.userAgent,
        userId: res.id,
      });

      // [6.2.5] Write the refresh token to the cookie and send the access token in the response body.
      set.headers["set-cookie"] = createRefreshCookie(tokens.refreshToken);

      return SUCCESS_RESPONSE({
        data: { ...res, accessToken: tokens.accessToken },
        message: responseMessage("login").success,
      });
    },

    { detail: docs(LABEL).login },
  )

  // ----- [6.3] /refresh -----
  // Flow: read cookie -> verify old token -> validate session -> rotate session -> set new cookie -> return new access token.
  .post(
    "/refresh",
    async ({ accessJwt, headers, refreshJwt, set }) => {
      // [6.3.1] Read the refresh token from the request cookie.
      const cookieHeader = (headers as THeadersMap).cookie;
      const refreshToken = readRefreshTokenFromCookie(cookieHeader);

      if (!refreshToken) {
        set.headers["set-cookie"] = clearRefreshCookie();
        set.status = 401;
        return ERROR_RESPONSE({
          message: responseMessage("refresh token").required,
        });
      }

      // [6.3.2] Verify the refresh JWT, then extract user id and jti from the payload.
      const decoded = await refreshJwt.verify(refreshToken);
      const userId = parseSubjectToUserId((decoded as TJwtPayload)?.sub);
      const refreshJti = parseJwtStringField((decoded as TJwtPayload)?.jti);

      if (!decoded || !userId || !refreshJti) {
        set.headers["set-cookie"] = clearRefreshCookie();
        set.status = 401;
        return ERROR_RESPONSE({
          message: responseMessage("refresh token").invalid + " or " + responseMessage("refresh token").expired,
        });
      }

      // [6.3.3] Reject tokens that are already present in the Redis blocklist.
      if (await service.isBlocklisted(refreshJti)) {
        set.headers["set-cookie"] = clearRefreshCookie();
        set.status = 401;
        return ERROR_RESPONSE({
          message: responseMessage("refresh token").invalid,
        });
      }

      // [6.3.4] Load the active refresh session by the token jti.
      const session = await service.getRefreshSessionByJti(refreshJti);

      if (!session) {
        set.headers["set-cookie"] = clearRefreshCookie();
        set.status = 401;
        return ERROR_RESPONSE({
          message: responseMessage("refresh token").invalid,
        });
      }

      // [6.3.5] Compare the raw cookie token to the hashed token stored in the database.
      const isHashMatch = await service.isRefreshTokenHashMatch(refreshToken, session.tokenHash);

      if (!isHashMatch) {
        await service.revokeRefreshFamily(session.userId, session.familyId);
        set.headers["set-cookie"] = clearRefreshCookie();
        set.status = 401;
        return ERROR_RESPONSE({
          message: responseMessage("refresh token").invalid,
        });
      }

      // [6.3.6] If the old session is already revoked, consider the token no longer usable.
      if (session.revokedAt) {
        if (session.replacedByJti) {
          await service.revokeRefreshFamily(session.userId, session.familyId);
        }

        set.headers["set-cookie"] = clearRefreshCookie();
        set.status = 401;
        return ERROR_RESPONSE({
          message: responseMessage("refresh token").invalid,
        });
      }

      // [6.3.7] If the session is expired, revoke it immediately to keep state clean.
      if (session.expiresAt.getTime() <= Date.now()) {
        await service.revokeRefreshSessionByJti(session.jti);
        set.headers["set-cookie"] = clearRefreshCookie();
        set.status = 401;
        return ERROR_RESPONSE({
          message: responseMessage("refresh token").expired,
        });
      }

      // [6.3.8] Ensure the token owner user still exists.
      const user = await service.getUserById(userId);

      if (!user) {
        set.headers["set-cookie"] = clearRefreshCookie();
        set.status = 404;
        return ERROR_RESPONSE({ message: responseMessage("users").notFound });
      }

      // [6.3.9] Issue a new token pair for rotation.
      const tokens = await issueAccessAndRefreshTokens({ accessJwt, refreshJwt, userId: user.id });

      // [6.3.10] Persist client metadata for the new session.
      const clientMetadata = getClientMetadata(headers as THeadersMap);

      // [6.3.11] Blocklist the old token, then rotate the refresh session (statefully).
      await service.addToBlocklist(session.jti, session.expiresAt);
      await service.rotateRefreshSession({
        currentJti: session.jti,
        expiresAt: tokens.expiresAt,
        familyId: session.familyId,
        ipAddress: clientMetadata.ipAddress,
        newJti: tokens.refreshJti,
        rotatedFromJti: session.jti,
        token: tokens.refreshToken,
        userAgent: clientMetadata.userAgent,
        userId: user.id,
      });

      // [6.3.12] Write the new refresh token to the cookie and return the new access token.
      set.headers["set-cookie"] = createRefreshCookie(tokens.refreshToken);

      return SUCCESS_RESPONSE({
        data: { accessToken: tokens.accessToken },
        message: responseMessage("token").updated,
      });
    },

    { detail: docs(LABEL).refresh },
  )

  // ----- [6.4] /logout -----
  // Flow: revoke refresh token if present -> blocklist access token if present -> clear cookie.
  .post(
    "/logout",
    async ({ accessJwt, headers, refreshJwt, set }) => {
      // [6.4.1] Try to read the refresh token from the cookie to revoke it.
      const cookieHeader = (headers as THeadersMap).cookie;
      const refreshToken = readRefreshTokenFromCookie(cookieHeader);

      if (refreshToken) {
        // [6.4.2] If the refresh token is valid, revoke the session and blocklist its jti.
        const decodedRefresh = await refreshJwt.verify(refreshToken);
        const refreshJti = parseJwtStringField((decodedRefresh as TJwtPayload)?.jti);
        const refreshExp = parseJwtExp((decodedRefresh as TJwtPayload)?.exp);

        if (refreshJti) {
          await service.revokeRefreshSessionByJti(refreshJti);
        }

        if (refreshJti && refreshExp) {
          await service.addToBlocklist(refreshJti, new Date(refreshExp * 1000));
        }
      }

      const authorization = headers.authorization;
      const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;

      if (bearerToken) {
        // [6.4.3] Blocklist the currently active access token so it can't be used again.
        const decodedAccess = await accessJwt.verify(bearerToken);
        if (decodedAccess?.jti && decodedAccess.exp) {
          await service.addToBlocklist(decodedAccess.jti, new Date(decodedAccess.exp * 1000));
        }
      }

      // [6.4.4] Clear the refresh token cookie in the browser/client.
      set.headers["set-cookie"] = clearRefreshCookie();

      return SUCCESS_RESPONSE({ data: null, message: responseMessage("logout").success });
    },

    { detail: docs(LABEL).logout },
  )

  // ----- [6.5] /me -----
  // Flow: verify access token -> extract user id -> fetch user profile -> return response.
  .get(
    "/me",
    async ({ accessJwt, headers, set }) => {
      // [6.5.1] Ensure the access token is valid and can be mapped to a user id.
      const auth = await getAuthenticatedUserId({ accessJwt, headers, set });
      if (auth.error) {
        set.status = 401;
        return auth.error;
      }

      // [6.5.2] Fetch the user data using the id from the token claim.
      const res = await service.getUserById(auth.userId);

      if (!res) {
        set.status = 404;
        return ERROR_RESPONSE({ message: responseMessage("users").notFound });
      }

      return SUCCESS_RESPONSE({ data: res, message: responseMessage("users").retrieved });
    },

    { detail: docs(LABEL).me },
  )

  // ----- [6.6] /change-password -----
  // Flow: verify access token -> validate body -> verify old password -> update password.
  .post(
    "/change-password",
    async ({ accessJwt, body, headers, set }) => {
      // [6.6.1] Ensure the request is made by an authenticated user.
      const auth = await getAuthenticatedUserId({ accessJwt, headers, set });
      if (auth.error) {
        set.status = 401;
        return auth.error;
      }

      // [6.6.2] Validate the change-password payload.
      const payload = changePasswordSchema.parse(body);

      // [6.6.3] The service validates the old password, then updates the password with a hashed new password.
      const res = await service.changePassword(auth.userId, payload);

      if (!res) {
        set.status = 401;
        return ERROR_RESPONSE({ message: responseMessage("current password").invalid });
      }

      return SUCCESS_RESPONSE({ data: res, message: responseMessage("password").updated });
    },

    { detail: docs(LABEL).changePassword },
  );
