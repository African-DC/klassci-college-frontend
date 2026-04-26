// Client-side Sentry init — loaded in the browser.
// Next.js 15.5+ auto-loads this from the project root.
// No-op if NEXT_PUBLIC_SENTRY_DSN is not set.

import * as Sentry from '@sentry/nextjs'

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0-alpha',
    tracesSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
    debug: false,
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
