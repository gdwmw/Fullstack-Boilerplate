import { Elysia } from "elysia";
import { randomUUID } from "node:crypto";
import { createWriteStream, mkdirSync, type WriteStream } from "node:fs";
import { join } from "node:path";

import { logger } from "@/src/libs";
import { compressArchivedLogFiles, compressLogFile, getLogDirectory, getPrismaErrorMessage, getRequestLogFileName } from "@/src/utils";

export const requestStartTimes = new WeakMap<Request, number>();

let activeLogDate = "";
let activeLogStream: null | WriteStream = null;
let activeLogPath = "";
const requestIds = new WeakMap<Request, string>();

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

  .onAfterHandle({ as: "global" }, ({ request, server, set }) => {
    const requestId = requestIds.get(request) ?? randomUUID();
    const startedAt = requestStartTimes.get(request) ?? performance.now();
    const durationMs = Math.round(performance.now() - startedAt);
    const statusCode = getStatusCode(set.status);
    const pathname = new URL(request.url).pathname;
    const line = `${statusCode} | ${request.method} | ${pathname} | ${durationMs}ms`;

    logger.info(line);
    if (shouldWriteSuccessRequestLog({ method: request.method, pathname })) {
      writeRequestLog({
        durationMs,
        ip: getRequestIp(request, server),
        level: "INFO",
        method: request.method,
        path: pathname,
        requestId,
        statusCode,
        ts: new Date().toISOString(),
        userAgent: request.headers.get("user-agent") || "unknown",
      });
    }
  })

  .onError({ as: "global" }, ({ error, request, server, set }) => {
    const requestId = requestIds.get(request) ?? randomUUID();
    const startedAt = requestStartTimes.get(request) ?? performance.now();
    const durationMs = Math.round(performance.now() - startedAt);
    const statusCode = resolveErrorStatusCode(set.status, error);
    const pathname = new URL(request.url).pathname;
    const line = `${statusCode} | ${request.method} | ${pathname} | ${durationMs}ms`;
    const errorMessage = getErrorMessage(error);

    logger.error({ message: errorMessage }, line);
    if (shouldWriteErrorRequestLog(pathname)) {
      writeRequestLog({
        durationMs,
        error: errorMessage,
        ip: getRequestIp(request, server),
        level: "ERROR",
        method: request.method,
        path: pathname,
        requestId,
        statusCode,
        ts: new Date().toISOString(),
        userAgent: request.headers.get("user-agent") || "unknown",
      });
    }
  });
