import type { Request, Response, NextFunction } from "express";
import { RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible";
import { getRedisClient } from "./client";

export interface RateLimiterConfig {
  keyPrefix: string;
  points: number;
  duration: number;
  blockDuration?: number;
}

export interface RateLimitLogger {
  warn: (message: string) => void;
  error: (message: string) => void;
}

const defaultLogger: RateLimitLogger = {
  warn: (message) => console.warn(message),
  error: (message) => console.error(message),
};

export interface RateLimitMiddlewareOptions {
  keyGenerator?: (req: Request) => string;
  handler?: (
    req: Request,
    res: Response,
    next: NextFunction,
    retryAfter: number,
  ) => void;
  logger?: RateLimitLogger;
}

function resolveKey(
  req: Request,
  keyGenerator?: (req: Request) => string,
): string {
  if (keyGenerator) {
    return keyGenerator(req);
  }

  const user = (req as any).user;
  if (user?.id) return `user_${user.id}`;

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    "unknown";
  return `ip_${ip}`;
}

function rateLimitResponse(res: Response, retryAfter: number) {
  res.set("Retry-After", String(retryAfter));
  res.set("X-RateLimit-Reset", String(Date.now() + retryAfter * 1000));
  res.status(429).json({
    success: false,
    message: "Too many requests. Please slow down.",
    retryAfter,
  });
}

export function createRateLimiter(config: RateLimiterConfig): RateLimiterRedis {
  return new RateLimiterRedis({
    storeClient: getRedisClient(),
    keyPrefix: config.keyPrefix,
    points: config.points,
    duration: config.duration,
    blockDuration: config.blockDuration,
  });
}

export function createRateLimitMiddleware(
  limiter: RateLimiterRedis,
  options?: RateLimitMiddlewareOptions,
) {
  const logger = options?.logger ?? defaultLogger;

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = resolveKey(req, options?.keyGenerator);
    try {
      await limiter.consume(key);
      next();
    } catch (err) {
      if (err instanceof RateLimiterRes) {
        const retryAfter = Math.ceil(err.msBeforeNext / 1000);
        logger.warn(
          `[rate-limit] blocked key=${key} retryAfter=${retryAfter}s`,
        );

        if (options?.handler) {
          options.handler(req, res, next, retryAfter);
        } else {
          rateLimitResponse(res, retryAfter);
        }
      } else {
        // Not a rate-limit rejection — a real Redis/infra error.
        // Fail open rather than blocking legitimate traffic.
        logger.error(`[rate-limit] Redis error, failing open: ${err}`);
        next();
      }
    }
  };
}
