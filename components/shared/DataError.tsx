"use client"

import { WifiOff, RefreshCw, ShieldOff, SearchX, ServerCrash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type ErrorType = "forbidden" | "not-found" | "server" | "network"

function detectErrorType(error?: Error | null, message?: string): ErrorType {
  const text = error?.message ?? message ?? ""
  const lower = text.toLowerCase()

  if (lower.includes("permission denied") || lower.includes("403") || lower.includes("accès refusé") || lower.includes("forbidden")) {
    return "forbidden"
  }
  if (lower.includes("not found") || lower.includes("404") || lower.includes("introuvable")) {
    return "not-found"
  }
  if (lower.includes("500") || lower.includes("internal") || lower.includes("erreur serveur")) {
    return "server"
  }
  return "network"
}

const ERROR_CONFIG: Record<ErrorType, {
  title: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
}> = {
  forbidden: {
    title: "Accès refusé",
    icon: ShieldOff,
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  "not-found": {
    title: "Ressource introuvable",
    icon: SearchX,
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
  },
  server: {
    title: "Erreur serveur",
    icon: ServerCrash,
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive/60",
  },
  network: {
    title: "Connexion au serveur impossible",
    icon: WifiOff,
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive/60",
  },
}

interface DataErrorProps {
  message?: string
  error?: Error | null
  onRetry?: () => void
  compact?: boolean
}

export function DataError({
  message = "Impossible de contacter le serveur",
  error,
  onRetry,
  compact = false,
}: DataErrorProps) {
  const errorType = detectErrorType(error, message)
  const config = ERROR_CONFIG[errorType]
  const Icon = config.icon

  // Pour forbidden, afficher le détail de la permission si disponible
  const displayMessage = errorType === "forbidden"
    ? (error?.message ?? message).replace(/Permission denied:\s*/i, "Permission manquante : ")
    : message

  if (compact) {
    return (
      <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
        errorType === "forbidden"
          ? "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30"
          : "border-destructive/20 bg-destructive/5"
      }`}>
        <Icon className={`h-4 w-4 shrink-0 ${config.iconColor}`} />
        <p className={`text-sm ${
          errorType === "forbidden"
            ? "text-amber-800 dark:text-amber-300"
            : "text-destructive/80"
        }`}>{displayMessage}</p>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 text-xs"
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
    <Card className={
      errorType === "forbidden"
        ? "border-amber-200 dark:border-amber-900/50"
        : errorType === "not-found"
          ? "border-border"
          : "border-destructive/20"
    }>
      <CardContent className="flex flex-col items-center justify-center py-10 text-center">
        <div className={`flex h-14 w-14 items-center justify-center rounded-full ${config.iconBg} mb-4`}>
          <Icon className={`h-6 w-6 ${config.iconColor}`} />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">
          {config.title}
        </p>
        <p className="text-xs text-muted-foreground mb-4 max-w-xs">
          {displayMessage}
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
