import pino, { type LoggerOptions } from "pino";

const loggerOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? "info",
};

loggerOptions.transport = {
  options: {
    colorize: true,
    ignore: "pid,hostname",
    singleLine: true,
    translateTime: "dd-mm-yyyy HH:MM:ss",
  },
  target: "pino-pretty",
};

export const logger = pino(loggerOptions);
