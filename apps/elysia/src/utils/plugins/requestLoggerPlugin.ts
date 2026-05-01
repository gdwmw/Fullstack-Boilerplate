import { Elysia } from "elysia";

import { logger } from "@/src/libs";

export const requestStartTimes = new WeakMap<Request, number>();

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
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

export const requestLoggerPlugin = new Elysia({ name: "request-logger" })
  .onRequest(({ request }) => {
    const requestLog = getRequestLogger(request);

    requestStartTimes.set(request, performance.now());
    requestLog.info("incoming request");
  })

  .onAfterHandle(({ request, set }) => {
    const requestLog = getRequestLogger(request);
    const startedAt = requestStartTimes.get(request) ?? performance.now();
    const durationMs = Math.round(performance.now() - startedAt);
    const statusCode = getStatusCode(set.status);

    requestLog.info({ durationMs, statusCode }, "request completed");
  })

  .onError(({ code, error, request, set }) => {
    const requestLog = getRequestLogger(request);
    const startedAt = requestStartTimes.get(request) ?? performance.now();
    const durationMs = Math.round(performance.now() - startedAt);
    const statusCode = getStatusCode(set.status, 500);

    requestLog.error(
      {
        code,
        durationMs,
        error: getErrorMessage(error),
        statusCode,
      },
      "request failed",
    );
  });
