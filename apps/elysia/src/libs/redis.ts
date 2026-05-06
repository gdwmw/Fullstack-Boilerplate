import IORedis from "ioredis";

import { logger } from "./pino";

export const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
});

redis.on("error", (err) => {
  logger.error({ message: err.message.toLowerCase() }, "redis connection error");
});

redis.on("connect", () => {
  logger.info("redis connected");
});
