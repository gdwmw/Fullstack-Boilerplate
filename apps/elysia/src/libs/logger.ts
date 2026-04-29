import pino, { type LoggerOptions } from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";

const loggerOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? "info",
};

if (isDevelopment) {
  loggerOptions.transport = {
    options: {
      colorize: true,
      ignore: "pid,hostname",
      singleLine: true,
      translateTime: "SYS:standard",
    },
    target: "pino-pretty",
  };
}

export const logger = pino(loggerOptions);
