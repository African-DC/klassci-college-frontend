'use client'

// Sentry-recommended pattern pour App Router : capture les erreurs des
// Server Components / route handlers / middleware via Sentry, et affiche
// l'erreur fallback Next.js. Sans ce fichier, le build essaie de prerender
// le legacy pages /_error → useRef null pendant le static export.
// Doc : https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#create-a-custom-error-page

import * as Sentry from '@sentry/nextjs'
import NextError from 'next/error'
import { useEffect } from 'react'

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="fr">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
