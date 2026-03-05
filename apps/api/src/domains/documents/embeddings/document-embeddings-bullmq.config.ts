import type { ConnectionOptions } from "bullmq"

export function getDocumentEmbeddingsBullMqConnection(): ConnectionOptions {
  const redisUrl = process.env.BULLMQ_REDIS_URL ?? "redis://localhost:6379"
  const parsedRedisUrl = new URL(redisUrl)

  return {
    host: parsedRedisUrl.hostname,
    port: Number(parsedRedisUrl.port || "6379"),
    ...(parsedRedisUrl.username && { username: parsedRedisUrl.username }),
    ...(parsedRedisUrl.password && { password: parsedRedisUrl.password }),
    ...(parsedRedisUrl.protocol === "rediss:" && { tls: {} }),
  }
}
