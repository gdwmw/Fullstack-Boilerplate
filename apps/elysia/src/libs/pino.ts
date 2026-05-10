import pino, { type LoggerOptions } from "pino";

import { env } from "@/src/config/env";

const loggerOptions: LoggerOptions = {
  level: env.LOG_LEVEL,
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
