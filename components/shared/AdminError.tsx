"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AdminErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/** Composant partagé pour les error.tsx Next.js sous (admin) */
export default function AdminError({ reset }: AdminErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold">Une erreur est survenue</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Une erreur inattendue est survenue. Vous pouvez réessayer ou créer un signalement.
        </p>
      </div>
      <Button variant="secondary" asChild><Link href="/admin/support">Signaler ce problème</Link></Button>
      <Button onClick={reset} variant="outline">
        Réessayer
      </Button>
    </div>
  )
}
