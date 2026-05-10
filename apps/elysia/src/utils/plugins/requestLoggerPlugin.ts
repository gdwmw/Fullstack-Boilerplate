import { Elysia } from "elysia";
import { randomUUID } from "node:crypto";
import { createWriteStream, mkdirSync, type WriteStream } from "node:fs";
import { join } from "node:path";

import { env } from "@/src/environment";
import { logger, prisma } from "@/src/libs";
import {
  compressArchivedLogFiles,
  compressLogFile,
  getBearerToken,
  getLogDirectory,
  getPrismaErrorMessage,
  getRequestLogFileName,
} from "@/src/utils";

export const requestStartTimes = new WeakMap<Request, number>();

let activeLogDate = "";
let activeLogStream: null | WriteStream = null;
let activeLogPath = "";
const requestIds = new WeakMap<Request, string>();
const requestUsers = new WeakMap<Request, Promise<null | TAuditLogUser>>();

const SENSITIVE_FIELD_NAMES = new Set([
  "access-token",
  "accesstoken",
  "api-key",
  "apikey",
  "authorization",
  "confirm-password",
  "confirmpassword",
  "confirmPassword",
  "cookie",
  "current-password",
  "currentpassword",
  "currentPassword",
  "new-password",
  "newPassword",
  "newpassword",
  "old-password",
  "oldpassword",
  "oldPassword",
  "password",
  "refresh-token",
  "refreshtoken",
  "refreshToken",
  "secret",
  "set-cookie",
  "token",
  "x-api-key",
]);

const PAYLOAD_LOG_EXCLUDED_PATHS = ["/auth", "/users"];

type TAuditLogUser = {
  email: null | string;
  name: null | string;
  phone: null | string;
  role: null | string;
  username: null | string;
};

const textEncoder = new TextEncoder();

const base64UrlToUint8Array = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const decoded = Buffer.from(padded, "base64");

  return new Uint8Array(decoded);
};

const decodeBase64UrlJson = (value: string) => JSON.parse(Buffer.from(base64UrlToUint8Array(value)).toString("utf-8")) as Record<string, unknown>;

const verifyAccessTokenPayload = async (token: string) => {
  const secret = env.JWT_ACCESS_SECRET;

  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    return null;
  }

  try {
    const header = decodeBase64UrlJson(encodedHeader);

    if (header.alg !== "HS256") {
      return null;
    }

    const cryptoKey = await crypto.subtle.importKey("raw", textEncoder.encode(secret), { hash: "SHA-256", name: "HMAC" }, false, ["verify"]);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      cryptoKey,
      base64UrlToUint8Array(encodedSignature),
      textEncoder.encode(`${encodedHeader}.${encodedPayload}`),
    );

    if (!isValid) {
      return null;
    }

    const payload = decodeBase64UrlJson(encodedPayload);
    const exp = typeof payload.exp === "number" ? payload.exp : null;
    const nbf = typeof payload.nbf === "number" ? payload.nbf : null;
    const now = Math.floor(Date.now() / 1000);

    if ((exp !== null && exp <= now) || (nbf !== null && nbf > now)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};

const resolveRequestUser = async (request: Request) => {
  const cachedUser = requestUsers.get(request);

  if (cachedUser) {
    return cachedUser;
  }

  const userPromise = (async () => {
    const token = getBearerToken(request.headers.get("authorization") || undefined);

    if (!token) {
      return null;
    }

    const payload = await verifyAccessTokenPayload(token);
    const userId = Number.parseInt(String(payload?.sub ?? ""), 10);

    if (Number.isNaN(userId)) {
      return null;
    }

    return await prisma.users.findUnique({
      select: {
        email: true,
        name: true,
        phone: true,
        role: true,
        username: true,
      },
      where: { id: userId },
    });
  })();

  requestUsers.set(request, userPromise);
  return userPromise;
};

const sanitizePayload = (value: unknown, seen = new WeakSet<object>()): unknown => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof File) {
    return {
      name: value.name,
      size: value.size,
      type: value.type,
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizePayload(item, seen));
  }

  if (value instanceof FormData) {
    return Object.fromEntries(Array.from(value.entries()).map(([key, entryValue]) => [key, sanitizePayload(entryValue, seen)]));
  }

  if (typeof value !== "object") {
    return String(value);
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  seen.add(value);

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => {
      const normalizedKey = key.trim().toLowerCase();
      const compactedKey = normalizedKey.replace(/[_\s]/g, "");

      if (SENSITIVE_FIELD_NAMES.has(normalizedKey) || SENSITIVE_FIELD_NAMES.has(compactedKey)) {
        return [key, "[REDACTED]"];
      }

      return [key, sanitizePayload(entryValue, seen)];
    }),
  );
};

const shouldLogPayloadForPath = (pathname: string) => !PAYLOAD_LOG_EXCLUDED_PATHS.some((prefix) => pathname.startsWith(prefix));

const getAuditPayload = ({ body, pathname }: { body: unknown; pathname: string }) => {
  if (!shouldLogPayloadForPath(pathname)) {
    return null;
  }

  const sanitizedPayload = sanitizePayload(body);

  if (sanitizedPayload === null) {
    return null;
  }

  return sanitizedPayload;
};

const getRequestLogStream = () => {
  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);

  if (activeLogStream && activeLogDate === dateKey) {
    return activeLogStream;
  }

  if (activeLogStream) {
    const previousLogPath = activeLogPath;
    const stream = activeLogStream;

    activeLogStream = null;
    activeLogPath = "";

    stream.end(() => {
      if (previousLogPath) {
        void compressLogFile(previousLogPath);
      }
    });
  }

  const logDirectory = getLogDirectory();
  const fileName = getRequestLogFileName(now);

  mkdirSync(logDirectory, { recursive: true });
  const filePath = join(logDirectory, fileName);

  void compressArchivedLogFiles({ currentFileName: fileName, directory: logDirectory });

  activeLogDate = dateKey;
  activeLogPath = filePath;
  activeLogStream = createWriteStream(filePath, { flags: "a" });

  return activeLogStream;
};

const writeRequestLog = (payload: Record<string, unknown>) => {
  const stream = getRequestLogStream();
  stream.write(`${JSON.stringify(payload)}\n`);
};

const getHeaderIp = (request: Request) => {
  const candidates = [
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    request.headers.get("x-real-ip")?.trim(),
    request.headers.get("cf-connecting-ip")?.trim(),
    request.headers.get("true-client-ip")?.trim(),
    request.headers.get("x-client-ip")?.trim(),
    request.headers.get("fly-client-ip")?.trim(),
  ];

  const forwarded = request.headers.get("forwarded")?.trim();

  if (forwarded) {
    const match = forwarded.match(/for=(?:"?\[?)([^;\],"]+)/i);

    if (match?.[1]) {
      candidates.push(match[1].trim());
    }
  }

  for (const candidate of candidates) {
    if (candidate) {
      return candidate;
    }
  }

  return null;
};

const getSocketIp = (request: Request, server?: unknown) => {
  if (!server || typeof server !== "object") {
    return null;
  }

  const serverWithIp = server as {
    requestIP?: (request: Request) => { address?: string } | null;
  };

  if (typeof serverWithIp.requestIP !== "function") {
    return null;
  }

  return serverWithIp.requestIP(request)?.address ?? null;
};

const getRequestIp = (request: Request, server?: unknown) => getHeaderIp(request) || getSocketIp(request, server) || "unknown";

const resolveErrorStatusCode = (status: number | string | undefined, error: unknown) => {
  const statusFromSet = getStatusCode(status, 500);

  if (statusFromSet >= 400) {
    return statusFromSet;
  }

  if (error && typeof error === "object" && "status" in error) {
    const errorStatus = Number((error as { status?: unknown }).status);

    if (!Number.isNaN(errorStatus) && errorStatus >= 400) {
      return errorStatus;
    }
  }

  return 500;
};

export const getStatusCode = (status: number | string | undefined, fallback = 200) => {
  if (typeof status === "number") {
    return status;
  }

  if (typeof status === "string") {
    const parsedStatus = Number(status);

    if (!Number.isNaN(parsedStatus)) {
      return parsedStatus;
    }
  }

  return fallback;
};

export const getRequestLogger = (request: Request) => {
  const pathname = new URL(request.url).pathname;

  return logger.child({
    method: request.method,
    path: pathname,
  });
};

export const getErrorMessage = (error: unknown) => {
  const prismaMessage = getPrismaErrorMessage(error);

  if (prismaMessage) {
    return prismaMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

const shouldWriteSuccessRequestLog = ({ method, pathname }: { method: string; pathname: string }) => {
  if (pathname === "/audit" || pathname === "/auth/refresh") {
    return false;
  }

  return method !== "GET";
};

const shouldWriteErrorRequestLog = (pathname: string) => pathname !== "/audit" && pathname !== "/auth/refresh";

export const requestLoggerPlugin = new Elysia({ name: "request-logger" })
  .trace({ as: "global" }, ({ context }) => {
    requestStartTimes.set(context.request, performance.now());
    requestIds.set(context.request, randomUUID());
  })

  .onAfterHandle({ as: "global" }, async ({ body, request, server, set }) => {
    const requestId = requestIds.get(request) ?? randomUUID();
    const startedAt = requestStartTimes.get(request) ?? performance.now();
    const durationMs = Math.round(performance.now() - startedAt);
    const statusCode = getStatusCode(set.status);
    const pathname = new URL(request.url).pathname;
    const line = `${statusCode} | ${request.method} | ${pathname} | ${durationMs}ms`;

    logger.info(line);
    if (shouldWriteSuccessRequestLog({ method: request.method, pathname })) {
      const payload = getAuditPayload({ body, pathname });
      const user = await resolveRequestUser(request);

      writeRequestLog({
        durationMs,
        ip: getRequestIp(request, server),
        level: "INFO",
        method: request.method,
        path: pathname,
        payload,
        requestId,
        statusCode,
        ts: new Date().toISOString(),
        userAgent: request.headers.get("user-agent") || "unknown",
        users: user,
      });
    }
  })

  .onError({ as: "global" }, async ({ body, error, request, server, set }) => {
    const requestId = requestIds.get(request) ?? randomUUID();
    const startedAt = requestStartTimes.get(request) ?? performance.now();
    const durationMs = Math.round(performance.now() - startedAt);
    const statusCode = resolveErrorStatusCode(set.status, error);
    const pathname = new URL(request.url).pathname;
    const line = `${statusCode} | ${request.method} | ${pathname} | ${durationMs}ms`;
    const errorMessage = getErrorMessage(error);

    logger.error({ message: errorMessage }, line);
    if (shouldWriteErrorRequestLog(pathname)) {
      const payload = getAuditPayload({ body, pathname });
      const user = await resolveRequestUser(request);

      writeRequestLog({
        durationMs,
        error: errorMessage,
        ip: getRequestIp(request, server),
        level: "ERROR",
        method: request.method,
        path: pathname,
        payload,
        requestId,
        statusCode,
        ts: new Date().toISOString(),
        userAgent: request.headers.get("user-agent") || "unknown",
        users: user,
      });
    }
  });
