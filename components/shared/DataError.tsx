"use client"

import { WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface DataErrorProps {
  message?: string
  onRetry?: () => void
  compact?: boolean
}

export function DataError({
  message = "Impossible de contacter le serveur",
  onRetry,
  compact = false,
}: DataErrorProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
        <WifiOff className="h-4 w-4 shrink-0 text-destructive/70" />
        <p className="text-sm text-destructive/80">{message}</p>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 text-xs text-destructive/70 hover:text-destructive"
            onClick={onRetry}
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Réessayer
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className="border-destructive/20">
      <CardContent className="flex flex-col items-center justify-center py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mb-4">
          <WifiOff className="h-6 w-6 text-destructive/60" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">
          Connexion au serveur impossible
        </p>
        <p className="text-xs text-muted-foreground mb-4 max-w-xs">
          {message}
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Réessayer
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
