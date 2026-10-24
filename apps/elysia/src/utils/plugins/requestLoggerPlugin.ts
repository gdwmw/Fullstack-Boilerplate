import { Elysia } from "elysia";

import { logger } from "@/src/libs/pino";

const getStatusCode = (status: number | string | undefined, fallback: number) => {
  if (typeof status === "number") {
    return status;
  }

  if (typeof status === "string") {
    const parsedStatus = Number(status);

    if (Number.isFinite(parsedStatus)) {
      return parsedStatus;
    }
  }

  return fallback;
};

const logRequest = (method: string, path: string, statusCode: number, errorMessage?: string) => {
  const logData = { method, path, statusCode, ...(errorMessage ? { error: errorMessage } : {}) };

  if (statusCode >= 500) {
    logger.error(`${logData.method} | ${logData.statusCode} | ${logData.path} `);
  } else if (statusCode >= 400) {
    logger.warn(`${logData.method} | ${logData.statusCode} | ${logData.path} `);
  } else {
    logger.info(`${logData.method} | ${logData.statusCode} | ${logData.path} `);
  }
};

export const requestLoggerPlugin = new Elysia({ name: "request-logger" })
  .onAfterHandle({ as: "global" }, ({ request, set }) => {
    const statusCode = getStatusCode(set.status, 200);
    logRequest(request.method, new URL(request.url).pathname, statusCode);
  })
  .onError({ as: "global" }, ({ error, request, set }) => {
    const errorStatus = error && typeof error === "object" && "status" in error && typeof error.status === "number" ? error.status : undefined;
    const statusCode = getStatusCode(set.status, errorStatus ?? 500);
    const errorMessage = error instanceof Error ? error.message : String(error);

    logRequest(request.method, new URL(request.url).pathname, statusCode, errorMessage);
  });
