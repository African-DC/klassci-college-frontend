"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, AlertTriangle, RefreshCw } from "lucide-react"
import { usePlatformHealth } from "@/lib/hooks/super-admin/useDiagnose"

const ICONS = {
  ok: CheckCircle2,
  degraded: AlertTriangle,
  down: AlertCircle,
} as const

const COLOURS = {
  ok: "text-emerald-600",
  degraded: "text-amber-600",
  down: "text-destructive",
} as const

const LABELS = {
  ok: "Opérationnel",
  degraded: "Dégradé",
  down: "Hors service",
} as const

export function DiagnoseDashboard() {
  const { data, isLoading, isError, refetch, isFetching } = usePlatformHealth()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Diagnose</h1>
          <p className="text-sm text-muted-foreground">
            Vérification automatique toutes les 30 secondes.
            {data?.timestamp && (
              <> Dernière màj : {new Date(data.timestamp).toLocaleTimeString("fr-FR")}.</>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Rafraîchir l'état de la plateforme"
          className="h-11 sm:h-9"
        >
          <RefreshCw aria-hidden="true" className={`mr-1.5 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Rafraîchir
        </Button>
      </div>

      {data && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-md border p-4 ${
            data.overall === "ok"
              ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950"
              : data.overall === "degraded"
                ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950"
                : "border-destructive/40 bg-destructive/5"
          }`}
        >
          <p className="text-sm font-medium">État global : {LABELS[data.overall]}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-6 w-32" />
              </CardContent>
            </Card>
          ))
        ) : isError ? (
          <p className="col-span-full text-sm text-destructive">Échec du chargement</p>
        ) : (
          (data?.checks ?? []).map((check) => {
            const Icon = ICONS[check.status]
            return (
              <Card key={check.component}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${COLOURS[check.status]}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">{check.component}</p>
                      <p className="text-xs text-muted-foreground">
                        {LABELS[check.status]}
                        {check.message && ` — ${check.message}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
