// Next.js instrumentation hook — runs once when the server boots.
// Used to wire Sentry on Node.js + Edge runtimes.
// See: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation

import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (!process.env.SENTRY_DSN) return

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Capture errors from Server Components, route handlers, middleware
export const onRequestError = Sentry.captureRequestError
