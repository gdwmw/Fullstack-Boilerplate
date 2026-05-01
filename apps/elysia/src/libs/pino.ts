import pino, { type LoggerOptions } from "pino";

const loggerOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? "info",
};

export const logger = pino(loggerOptions);
