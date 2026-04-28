import IORedis from "ioredis";

export const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
});

redis.on("error", (err) => console.error("ERROR : (redis) -", err.message.toLowerCase()));
redis.on("connect", () => console.log("\x1b[32mSUCCESS : (redis) - connected\x1b[0m"));
