"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotificationsError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">{error.message || "Impossible de charger les notifications."}</p>
      <Button onClick={reset} variant="outline" size="sm">Réessayer</Button>
    </div>
  )
}
