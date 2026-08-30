import {
  createRateLimiter,
  createRateLimitMiddleware,
} from "@orra/redis/rate-limit";
import { logger } from "../utils/logger";

const globalLimiter = createRateLimiter({
  keyPrefix: "rl_global",
  points: 200,
  duration: 60,
  blockDuration: 30,
});

// Strict — reserved for actual credential submission: sign-in, sign-up,
// password reset, OTP verification. Brute-force protection belongs here.
const authLimiter = createRateLimiter({
  keyPrefix: "rl_auth",
  points: 20,
  duration: 60,
  blockDuration: 120,
});

// Loose — get-session fires on every protected-page navigation, including
// RSC requests and Next.js link prefetching, so this has to tolerate normal
// browsing rather than deliberate login attempts. Short block since a false
// positive here breaks routing entirely, not just slows down an attacker.
const sessionCheckLimiter = createRateLimiter({
  keyPrefix: "rl_session_check",
  points: 120,
  duration: 60,
  blockDuration: 10,
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
export const sessionCheckRateLimit = createRateLimitMiddleware(
  sessionCheckLimiter,
  { logger },
);
export const plaidRateLimit = createRateLimitMiddleware(plaidLimiter, {
  logger,
});
