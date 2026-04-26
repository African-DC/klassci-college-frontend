// Sentry init for Node.js runtime (Server Components, route handlers, server actions).
// No-op if SENTRY_DSN is not set — guarded in instrumentation.ts.

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0-alpha',
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  sendDefaultPii: false,
  debug: false,
})
