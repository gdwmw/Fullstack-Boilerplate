import { templateLog } from "@repo/utils";
import IORedis from "ioredis";

export const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
});

redis.on("error", (err) => templateLog.ERROR(err.message.toLowerCase(), "redis"));
redis.on("connect", () => templateLog.SUCCESS("connected", "redis"));
