import IORedis from "ioredis";

export const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
});

redis.on("error", (err) => console.error("ERROR : ", err.message.toLowerCase()));
redis.on("connect", () => console.info("INFO : redis connected"));
