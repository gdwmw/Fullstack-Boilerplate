import IORedis from "ioredis";

import { env } from "@/src/environment";

import { logger } from "./pino";

export const redis = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
});

redis.on("error", (err) => {
  logger.error({ message: err.message.toLowerCase() }, "redis connection error");
});

redis.on("connect", () => {
  logger.info("redis connected");
});
