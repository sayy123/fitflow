import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check if Redis credentials are provided
const hasRedis = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

// Create a mock rate limiter if Redis is not available
const mockRateLimit = {
  limit: async (identifier: string) => ({
    success: true,
    limit: 100,
    remaining: 99,
    reset: Date.now() + 10000,
  }),
};

// Create a new ratelimiter, that allows 5 requests per 10 seconds
export const loginRateLimit = hasRedis 
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "10 s"),
      analytics: true,
    })
  : mockRateLimit as unknown as Ratelimit;
