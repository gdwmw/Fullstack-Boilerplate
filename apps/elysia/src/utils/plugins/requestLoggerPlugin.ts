import { Elysia } from "elysia";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import pino from "pino";

import { env } from "@/src/environment";
import { logger } from "@/src/libs/pino";
import { prisma } from "@/src/libs/prisma";
import { getPrismaErrorMessage } from "@/src/utils/handle-prisma-error/handlePrismaError";
import { compressArchivedLogFiles, compressLogFile, getLogDirectory, getRequestLogFileName } from "@/src/utils/logCompression";
import { getBearerToken } from "@/src/utils/verifyAccessToken";

export const requestStartTimes = new WeakMap<Request, number>();

let activeLogDate = "";
let activeAuditLogger: null | pino.Logger = null;
let activeAuditDestination: null | ReturnType<typeof pino.destination> = null;
let activeLogPath = "";
const requestIds = new WeakMap<Request, string>();
const requestUsers = new WeakMap<Request, Promise<null | TAuditLogUser>>();

const SENSITIVE_FIELD_NAMES = new Set([
  "accesstoken",
  "apikey",
  "authorization",
  "confirmpassword",
  "cookie",
  "currentpassword",
  "newpassword",
  "oldpassword",
  "password",
  "refreshtoken",
  "secret",
  "setcookie",
  "token",
  "xapikey",
]);

const PAYLOAD_LOG_EXCLUDED_PATHS: string[] = [];

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
    const userId = typeof payload?.sub === "string" && payload.sub.length > 0 ? payload.sub : null;

    if (!userId) {
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

  const normalizeSensitiveFieldKey = (key: string) =>
    key
      .trim()
      .toLowerCase()
      .replace(/[-_\s]/g, "");

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => {
      const normalizedKey = normalizeSensitiveFieldKey(key);

      if (SENSITIVE_FIELD_NAMES.has(normalizedKey)) {
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

const getRequestAuditLogger = () => {
  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);

  if (activeAuditLogger && activeAuditDestination && activeLogDate === dateKey) {
    return activeAuditLogger;
  }

  if (activeAuditDestination) {
    const previousLogPath = activeLogPath;
    const destination = activeAuditDestination;

    activeAuditLogger = null;
    activeAuditDestination = null;
    activeLogPath = "";

    destination.once("close", () => {
      if (previousLogPath) {
        compressLogFile(previousLogPath);
      }
    });

    destination.end();
  }

  const logDirectory = getLogDirectory();
  const fileName = getRequestLogFileName(now);

  const filePath = join(logDirectory, fileName);

  compressArchivedLogFiles({ currentFileName: fileName, directory: logDirectory });

  const destination = pino.destination({
    append: true,
    dest: filePath,
    mkdir: true,
    sync: false,
  });

  activeAuditDestination = destination;
  activeAuditLogger = pino(
    {
      base: undefined,
      formatters: {
        level: (label) => ({ severity: label.toUpperCase() }),
      },
      timestamp: false,
    },
    destination,
  );

  activeLogDate = dateKey;
  activeLogPath = filePath;

  return activeAuditLogger;
};

const writeRequestLog = (payload: Record<string, unknown>) => {
  const auditLogger = getRequestAuditLogger();
  auditLogger.info(payload);
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
  if (isExcludedAuditPath(pathname)) {
    return false;
  }

  return method !== "GET";
};

const isExcludedAuditPath = (pathname: string) => pathname === "/audit" || pathname === "/auth/refresh";

const shouldWriteErrorRequestLog = (pathname: string) => !isExcludedAuditPath(pathname);

const getRequestLogMeta = (request: Request) => {
  const requestId = requestIds.get(request) ?? randomUUID();
  const startedAt = requestStartTimes.get(request) ?? performance.now();
  const durationMs = Math.round(performance.now() - startedAt);
  const pathname = new URL(request.url).pathname;

  return {
    durationMs,
    pathname,
    requestId,
  };
};

const createAuditLogEntry = async ({
  body,
  durationMs,
  error,
  level,
  pathname,
  request,
  requestId,
  server,
  statusCode,
}: {
  body: unknown;
  durationMs: number;
  error?: string;
  level: "ERROR" | "INFO";
  pathname: string;
  request: Request;
  requestId: string;
  server?: unknown;
  statusCode: number;
}) => {
  const payload = getAuditPayload({ body, pathname });
  const user = await resolveRequestUser(request);

  return {
    durationMs,
    ...(error ? { error } : {}),
    ip: getRequestIp(request, server),
    level,
    method: request.method,
    path: pathname,
    payload,
    requestId,
    statusCode,
    ts: new Date().toISOString(),
    userAgent: request.headers.get("user-agent") || "unknown",
    users: user,
  };
};

export const requestLoggerPlugin = new Elysia({ name: "request-logger" })
  .trace({ as: "global" }, ({ context }) => {
    requestStartTimes.set(context.request, performance.now());
    requestIds.set(context.request, randomUUID());
  })

  .onAfterHandle({ as: "global" }, async ({ body, request, server, set }) => {
    const { durationMs, pathname, requestId } = getRequestLogMeta(request);
    const statusCode = getStatusCode(set.status);
    const line = `${statusCode} | ${request.method} | ${pathname} | ${durationMs}ms`;

    logger.info(line);
    if (shouldWriteSuccessRequestLog({ method: request.method, pathname })) {
      writeRequestLog(
        await createAuditLogEntry({
          body,
          durationMs,
          level: "INFO",
          pathname,
          request,
          requestId,
          server,
          statusCode,
        }),
      );
    }
  })

  .onError({ as: "global" }, async ({ body, error, request, server, set }) => {
    const { durationMs, pathname, requestId } = getRequestLogMeta(request);
    const statusCode = resolveErrorStatusCode(set.status, error);
    const line = `${statusCode} | ${request.method} | ${pathname} | ${durationMs}ms`;
    const errorMessage = getErrorMessage(error);

    logger.error({ message: errorMessage }, line);
    if (shouldWriteErrorRequestLog(pathname)) {
      writeRequestLog(
        await createAuditLogEntry({
          body,
          durationMs,
          error: errorMessage,
          level: "ERROR",
          pathname,
          request,
          requestId,
          server,
          statusCode,
        }),
      );
    }
  });
