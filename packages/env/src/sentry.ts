import { z } from 'zod';

export const baseServerEnv = {
  NODE_ENV: z.enum(['development', 'production']).default('development'),
};

export const authEnv = {
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
};

export const sentryEnv = {
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENV: z.enum(['development', 'staging', 'production']).optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
  SENTRY_PROFILES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
  SENTRY_DEBUG: z.coerce.boolean().default(false),
};

export const webSentryEnv = {
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_ENV: z.enum(['development', 'staging', 'production']).optional(),
  NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
  NEXT_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
  NEXT_PUBLIC_SENTRY_DEBUG: z.coerce.boolean().default(false),
};