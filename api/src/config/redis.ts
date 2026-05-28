import Redis from "ioredis";
import { env } from "./env";
import { logger } from "./logger";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) {
      logger.error("Redis connection failed after 3 retries");
      return null;
    }
    return Math.min(times * 200, 2000);
  },
  lazyConnect: true,
  enableReadyCheck: true,
});

redis.on("connect", () => {
  logger.info("Redis connected successfully");
});

redis.on("error", (err) => {
  logger.error("Redis connection error:", err);
});

redis.on("ready", () => {
  logger.info("Redis ready");
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redis.connect();
  } catch (error) {
    logger.warn("Redis not available, running without cache:", error);
  }
};

export const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
  DAY: 86400,
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const cacheSet = async (key: string, value: unknown, ttl: number = CACHE_TTL.MEDIUM): Promise<void> => {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch {
    // silently fail
  }
};

export const cacheDel = async (pattern: string): Promise<void> => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // silently fail
  }
};
