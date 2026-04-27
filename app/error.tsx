'use client'

// Next.js App Router error boundary — handle errors in segments under app/.
// Sans ce fichier, Next.js prerender le legacy pages /_error → useRef null
// pendant le static export (incompat Sentry wrapping).

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-semibold text-foreground">Une erreur est survenue</h1>
      <p className="text-muted-foreground max-w-md">
        Désolé, quelque chose s&apos;est mal passé. L&apos;équipe technique a été notifiée.
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Réessayer
      </button>
    </div>
  )
}
