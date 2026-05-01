import pino, { type LoggerOptions } from "pino";

const loggerOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? "info",
  transport: {
    options: {
      ignore: "pid,hostname",
      singleLine: true,
      translateTime: "SYS:standard",
    },
    target: "pino-pretty",
  },
};

export const logger = pino(loggerOptions);
