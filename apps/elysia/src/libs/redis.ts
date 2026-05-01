import IORedis from "ioredis";

import { logger } from "./pino";

export const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
});

const redisLogger = logger.child({ scope: "redis" });

redis.on("error", (err) => {
  redisLogger.error({ error: err.message.toLowerCase() }, "redis connection error");
});

redis.on("connect", () => {
  redisLogger.info("redis connected");
});
