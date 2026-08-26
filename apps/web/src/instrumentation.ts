import * as Sentry from '@sentry/nextjs';
import { webEnv } from '@orra/env/web';

export function register() {
  if (!webEnv.NEXT_PUBLIC_SENTRY_DSN) {
    console.warn('[Sentry] No DSN provided, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: webEnv.NEXT_PUBLIC_SENTRY_DSN,
    environment: webEnv.NEXT_PUBLIC_SENTRY_ENV || 'development',
    tracesSampleRate: webEnv.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1,
    profilesSampleRate: webEnv.NEXT_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE ?? 0.1,
    debug: webEnv.NEXT_PUBLIC_SENTRY_DEBUG ?? false,
    
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    beforeSend(event, hint) {
      if (process.env.NODE_ENV === 'development') {
        return null;
      }
      return scrubEvent(event);
    },
    
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Network request failed',
      'hydration',
    ],
  });
  
  console.log('[Sentry] Client initialized');
}

function scrubEvent(event: any): any {
  const sensitiveKeys = [
    'password', 'token', 'secret', 'authorization', 'cookie',
    'credit_card', 'ssn', 'api_key', 'access_token', 'refresh_token',
  ];

  const scrub = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(scrub);

    const scrubbed: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = ['password', 'token', 'secret', 'authorization', 'cookie',
        'credit_card', 'ssn', 'api_key', 'access_token', 'refresh_token'].some(k => key.toLowerCase().includes(k.toLowerCase()));
      scrubbed[key] = isSensitive ? '[REDACTED]' : scrub(value);
    }
    return scrubbed;
  }

  if (event.exception?.values) {
    event.exception.values = event.exception.values.map((v: any) => ({
      ...v,
      value: v.value ? '[REDACTED]' : v.value,
    }));
  }

  if (event.request) event.request = scrub(event.request);
  if (event.extra) event.extra = scrub(event.extra);
  if (event.contexts) event.contexts = scrub(event.contexts);

  return event;
}