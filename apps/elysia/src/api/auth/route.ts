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
// Menentukan label route, nama cookie, dan type helper yang dipakai lokal.
// ---------------------------------------------------------------------------

const LABEL = "Authentication";
const REFRESH_COOKIE_NAME = process.env.JWT_REFRESH_COOKIE_NAME || "refreshToken";
const REFRESH_COOKIE_PATH = process.env.JWT_REFRESH_COOKIE_PATH || "/auth";
const REFRESH_COOKIE_SAME_SITE = process.env.JWT_REFRESH_COOKIE_SAME_SITE || "Lax";
const REFRESH_COOKIE_SECURE = process.env.JWT_REFRESH_COOKIE_SECURE !== "false";

type HeadersMap = Record<string, string | undefined>;
type JwtPayload = null | Record<string, unknown> | undefined;
type ResponseSet = {
  cookie?: Record<string, ElysiaCookie>;
  headers: HTTPHeaders;
  redirect?: string;
  status?: keyof StatusMap | number;
};

// ---------------------------------------------------------------------------
// [2] JWT payload helpers
// Membaca field penting dari payload JWT dengan parsing defensif.
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
// Membaca, membuat, dan membersihkan cookie refresh token.
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
// Mengambil metadata request yang nanti disimpan ke refresh session.
// ---------------------------------------------------------------------------

const getClientMetadata = (headers: HeadersMap) => {
  const rawIp = headers["x-forwarded-for"] || headers["x-real-ip"];
  const ipAddress = rawIp?.split(",")[0]?.trim();

  return {
    ipAddress: ipAddress && ipAddress.length > 0 ? ipAddress : undefined,
    userAgent: headers["user-agent"] || undefined,
  };
};

// ---------------------------------------------------------------------------
// [5] JWT & auth guard helpers
// Helper bersama untuk issue token dan ambil user id dari access token.
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
    throw new Error("Failed to parse refresh token expiration");
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
  accessJwt: { verify(token: string): Promise<JwtPayload> };
  headers: { authorization?: string };
  set: ResponseSet;
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
        message: responseMessage("Access token").invalid,
        token: { access: false },
      }),
      userId: null,
    };
  }

  return { error: null, userId };
};

// ---------------------------------------------------------------------------
// [6] Routes
// Endpoint auth dimulai dari sini. Nomor di komentar dipakai juga di README.
// ---------------------------------------------------------------------------

export const AuthRoutes = new Elysia({ prefix: "/auth" })
  .use(accessJwtPlugin)
  .use(refreshJwtPlugin)

  .onError(({ error, set }) => handlePrismaError(LABEL, error, set))

  // ----- [6.1] /register -----
  // Flow: validate body -> create user -> issue tokens -> simpan session -> set cookie -> return response.
  .post(
    "/register",
    async ({ accessJwt, body, headers, refreshJwt, set }) => {
      // [6.1.1] Validasi payload register lalu buat user baru.
      const payload = registerSchema.parse(body);
      const res = await service.register(payload);

      // [6.1.2] Buat pasangan access token dan refresh token untuk user baru.
      const tokens = await issueAccessAndRefreshTokens({ accessJwt, refreshJwt, userId: res.id });

      // [6.1.3] Ambil metadata request lalu simpan refresh session ke database.
      const clientMetadata = getClientMetadata(headers as HeadersMap);

      await service.createRefreshSession({
        expiresAt: tokens.expiresAt,
        familyId: crypto.randomUUID(),
        ipAddress: clientMetadata.ipAddress,
        jti: tokens.refreshJti,
        token: tokens.refreshToken,
        userAgent: clientMetadata.userAgent,
        userId: res.id,
      });

      // [6.1.4] Tulis refresh token ke cookie HttpOnly agar client tidak pegang token ini di JS runtime.
      set.headers["set-cookie"] = createRefreshCookie(tokens.refreshToken);

      set.status = 201;

      // [6.1.5] Kembalikan data user dan access token ke client.
      return SUCCESS_RESPONSE({
        data: { ...res, accessToken: tokens.accessToken },
        message: responseMessage("Register").success,
      });
    },

    { detail: docs(LABEL).register },
  )

  // ----- [6.2] /login -----
  // Flow: validate login -> verifikasi user -> issue tokens -> simpan session -> set cookie -> return response.
  .post(
    "/login",
    async ({ accessJwt, body, headers, refreshJwt, set }) => {
      // [6.2.1] Validasi payload berdasarkan metode login: email atau username.
      const payload = loginSchema((body as { method: "email" | "username" }).method).parse(body);

      // [6.2.2] Verifikasi kredensial user di service.
      const res = await service.login(payload);

      if (!res) {
        set.status = 401;
        return ERROR_RESPONSE({
          message: payload.method === "email" ? responseMessage("Email or Password").invalid : responseMessage("Username or Password").invalid,
        });
      }

      // [6.2.3] Jika valid, issue token pair baru.
      const tokens = await issueAccessAndRefreshTokens({ accessJwt, refreshJwt, userId: res.id });

      // [6.2.4] Simpan session refresh baru lengkap dengan metadata client.
      const clientMetadata = getClientMetadata(headers as HeadersMap);

      await service.createRefreshSession({
        expiresAt: tokens.expiresAt,
        familyId: crypto.randomUUID(),
        ipAddress: clientMetadata.ipAddress,
        jti: tokens.refreshJti,
        token: tokens.refreshToken,
        userAgent: clientMetadata.userAgent,
        userId: res.id,
      });

      // [6.2.5] Tulis refresh token ke cookie dan kirim access token di response body.
      set.headers["set-cookie"] = createRefreshCookie(tokens.refreshToken);

      return SUCCESS_RESPONSE({
        data: { ...res, accessToken: tokens.accessToken },
        message: responseMessage("Login").success,
      });
    },

    { detail: docs(LABEL).login },
  )

  // ----- [6.3] /refresh -----
  // Flow: baca cookie -> verifikasi token lama -> validasi session -> rotate session -> set cookie baru -> return access token baru.
  .post(
    "/refresh",
    async ({ accessJwt, headers, refreshJwt, set }) => {
      // [6.3.1] Ambil refresh token dari cookie request.
      const cookieHeader = (headers as HeadersMap).cookie;
      const refreshToken = readRefreshTokenFromCookie(cookieHeader);

      if (!refreshToken) {
        set.headers["set-cookie"] = clearRefreshCookie();
        set.status = 401;
        return ERROR_RESPONSE({
          message: responseMessage("Refresh token").required,
          token: { refresh: false },
        });
      }

      // [6.3.2] Verify JWT refresh token lalu ambil user id dan jti dari payload.
      const decoded = await refreshJwt.verify(refreshToken);
      const userId = parseSubjectToUserId((decoded as JwtPayload)?.sub);
      const refreshJti = parseJwtStringField((decoded as JwtPayload)?.jti);

      if (!decoded || !userId || !refreshJti) {
        set.headers["set-cookie"] = clearRefreshCookie();
        set.status = 401;
        return ERROR_RESPONSE({
          message: responseMessage("Refresh token").invalid + " or " + responseMessage("Refresh token").expired,
          token: { refresh: false },
        });
      }

      // [6.3.3] Tolak token yang sudah ada di blocklist Redis.
      if (await service.isBlocklisted(refreshJti)) {
        set.headers["set-cookie"] = clearRefreshCookie();
        set.status = 401;
        return ERROR_RESPONSE({
          message: responseMessage("Refresh token").invalid,
          token: { refresh: false },
        });
      }

      // [6.3.4] Ambil refresh session aktif berdasarkan jti token.
      const session = await service.getRefreshSessionByJti(refreshJti);

      if (!session) {
        set.headers["set-cookie"] = clearRefreshCookie();
        set.status = 401;
        return ERROR_RESPONSE({
          message: responseMessage("Refresh token").invalid,
          token: { refresh: false },
        });
      }

      // [6.3.5] Cocokkan token mentah dari cookie dengan hash token di database.
      const isHashMatch = await service.isRefreshTokenHashMatch(refreshToken, session.tokenHash);

      if (!isHashMatch) {
        await service.revokeRefreshFamily(session.userId, session.familyId);
        set.headers["set-cookie"] = clearRefreshCookie();
        set.status = 401;
        return ERROR_RESPONSE({
          message: responseMessage("Refresh token").invalid,
          token: { refresh: false },
        });
      }

      // [6.3.6] Jika session lama sudah revoked, anggap token tidak lagi boleh dipakai.
      if (session.revokedAt) {
        if (session.replacedByJti) {
          await service.revokeRefreshFamily(session.userId, session.familyId);
        }

        set.headers["set-cookie"] = clearRefreshCookie();
        set.status = 401;
        return ERROR_RESPONSE({
          message: responseMessage("Refresh token").invalid,
          token: { refresh: false },
        });
      }

      // [6.3.7] Session kedaluwarsa juga langsung direvoke agar state tetap bersih.
      if (session.expiresAt.getTime() <= Date.now()) {
        await service.revokeRefreshSessionByJti(session.jti);
        set.headers["set-cookie"] = clearRefreshCookie();
        set.status = 401;
        return ERROR_RESPONSE({
          message: responseMessage("Refresh token").expired,
          token: { refresh: false },
        });
      }

      // [6.3.8] Pastikan user pemilik token masih ada.
      const user = await service.getUserById(userId);

      if (!user) {
        set.headers["set-cookie"] = clearRefreshCookie();
        set.status = 404;
        return ERROR_RESPONSE({ message: responseMessage("Users").notFound });
      }

      // [6.3.9] Issue token pair baru untuk rotasi.
      const tokens = await issueAccessAndRefreshTokens({ accessJwt, refreshJwt, userId: user.id });

      // [6.3.10] Simpan metadata client untuk session baru.
      const clientMetadata = getClientMetadata(headers as HeadersMap);

      // [6.3.11] Blocklist token lama lalu rotate refresh session secara stateful.
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

      // [6.3.12] Tulis refresh token baru ke cookie dan kirim access token baru.
      set.headers["set-cookie"] = createRefreshCookie(tokens.refreshToken);

      return SUCCESS_RESPONSE({
        data: { accessToken: tokens.accessToken },
        message: responseMessage("Token").updated,
      });
    },

    { detail: docs(LABEL).refresh },
  )

  // ----- [6.4] /logout -----
  // Flow: revoke refresh token jika ada -> blocklist access token jika ada -> bersihkan cookie.
  .post(
    "/logout",
    async ({ accessJwt, headers, refreshJwt, set }) => {
      // [6.4.1] Coba ambil refresh token dari cookie untuk dibatalkan.
      const cookieHeader = (headers as HeadersMap).cookie;
      const refreshToken = readRefreshTokenFromCookie(cookieHeader);

      if (refreshToken) {
        // [6.4.2] Jika refresh token valid, revoke session dan blocklist jti-nya.
        const decodedRefresh = await refreshJwt.verify(refreshToken);
        const refreshJti = parseJwtStringField((decodedRefresh as JwtPayload)?.jti);
        const refreshExp = parseJwtExp((decodedRefresh as JwtPayload)?.exp);

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
        // [6.4.3] Access token yang sedang aktif juga diblok agar tidak bisa dipakai lagi.
        const decodedAccess = await accessJwt.verify(bearerToken);
        if (decodedAccess?.jti && decodedAccess.exp) {
          await service.addToBlocklist(decodedAccess.jti, new Date(decodedAccess.exp * 1000));
        }
      }

      // [6.4.4] Bersihkan cookie refresh token di browser/client.
      set.headers["set-cookie"] = clearRefreshCookie();

      return SUCCESS_RESPONSE({ data: null, message: responseMessage("Logout").success });
    },

    { detail: docs(LABEL).logout },
  )

  // ----- [6.5] /me -----
  // Flow: verifikasi access token -> ambil user id -> ambil profil user -> return response.
  .get(
    "/me",
    async ({ accessJwt, headers, set }) => {
      // [6.5.1] Pastikan access token valid dan bisa dipetakan ke user id.
      const auth = await getAuthenticatedUserId({ accessJwt, headers, set });
      if (auth.error) {
        set.status = 401;
        return auth.error;
      }

      // [6.5.2] Ambil data user berdasarkan id dari claim token.
      const res = await service.getUserById(auth.userId);

      if (!res) {
        set.status = 404;
        return ERROR_RESPONSE({ message: responseMessage("Users").notFound });
      }

      return SUCCESS_RESPONSE({ data: res, message: responseMessage("Users").retrieved });
    },

    { detail: docs(LABEL).me },
  )

  // ----- [6.6] /change-password -----
  // Flow: verifikasi access token -> validasi body -> verifikasi password lama -> update password.
  .post(
    "/change-password",
    async ({ accessJwt, body, headers, set }) => {
      // [6.6.1] Pastikan request datang dari user yang sudah login.
      const auth = await getAuthenticatedUserId({ accessJwt, headers, set });
      if (auth.error) {
        set.status = 401;
        return auth.error;
      }

      // [6.6.2] Validasi payload perubahan password.
      const payload = changePasswordSchema.parse(body);

      // [6.6.3] Service akan cek password lama lalu update password baru yang sudah di-hash.
      const res = await service.changePassword(auth.userId, payload);

      if (!res) {
        set.status = 401;
        return ERROR_RESPONSE({ message: responseMessage("Current password").invalid });
      }

      return SUCCESS_RESPONSE({ data: res, message: responseMessage("Password").updated });
    },

    { detail: docs(LABEL).changePassword },
  );
