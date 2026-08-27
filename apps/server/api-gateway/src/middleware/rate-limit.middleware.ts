import { createRateLimiter, createRateLimitMiddleware } from "@orra/redis";
import { logger } from "../utils/logger";

const globalLimiter = createRateLimiter({
  keyPrefix: "rl_global",
  points: 200,
  duration: 60,
  blockDuration: 30,
});

const authLimiter = createRateLimiter({
  keyPrefix: "rl_auth",
  points: 20,
  duration: 60,
  blockDuration: 120,
});

const plaidLimiter = createRateLimiter({
  keyPrefix: "rl_plaid",
  points: 30,
  duration: 60,
  blockDuration: 60,
});

export const globalRateLimit = createRateLimitMiddleware(globalLimiter, {
  logger,
});
export const authRateLimit = createRateLimitMiddleware(authLimiter, { logger });
export const plaidRateLimit = createRateLimitMiddleware(plaidLimiter, {
  logger,
});
