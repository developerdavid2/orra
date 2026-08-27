export interface SentryConfig {
  dsn: string;
  environment: string;
  serviceName: string;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
  debug?: boolean;
  release?: string;
}

export interface SentryClientConfig {
  dsn: string;
  environment: string;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
  debug?: boolean;
  release?: string;
}

export interface SpanOptions {
  name: string;
  op?: string;
  attributes?: Record<string, string | number | boolean>;
  parentSpan?: any;
}

export interface SentryScopeData {
  user?: {
    id: string;
    email?: string;
    username?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

export interface SentryEvent {
  message?: string;
  exception?: Error;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}