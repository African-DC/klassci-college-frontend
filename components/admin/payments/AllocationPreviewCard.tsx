"use client"

import { AlertTriangle, CheckCircle2, Circle, CircleDot, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { FEE_STATUS_LABEL, type AllocationPreview, type AllocationPreviewLine } from "@/lib/contracts/payment"

interface AllocationPreviewCardProps {
  preview: AllocationPreview | undefined
  isLoading: boolean
  error: Error | null
}

function formatFcfa(value: number): string {
  return `${Number(value).toLocaleString("fr-FR")} XOF`
}

function statusIcon(status: AllocationPreviewLine["status_after"]) {
  if (status === "paid") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
  if (status === "partial") return <CircleDot className="h-4 w-4 text-amber-600" />
  if (status === "waived") return <Circle className="h-4 w-4 text-muted-foreground" />
  if (status === "in_kind") return <CheckCircle2 className="h-4 w-4 text-sky-600" />
  return <Circle className="h-4 w-4 text-muted-foreground" />
}

function statusLabel(status: AllocationPreviewLine["status_after"]): string {
  return FEE_STATUS_LABEL[status] ?? "En attente"
}

export function AllocationPreviewCard({
  preview,
  isLoading,
  error,
}: AllocationPreviewCardProps) {
  if (isLoading) {
    return (
      <div
        className="rounded-xl border border-border bg-muted/30 p-4"
        aria-busy="true"
        aria-label="Calcul de l'allocation en cours"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Calcul de l&apos;allocation…
        </div>
        <div className="mt-3 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm">
        <p className="font-medium text-rose-900">Impossible de calculer l&apos;allocation</p>
        <p className="text-rose-800">{error.message}</p>
      </div>
    )
  }

  if (!preview) return null

  const lines = preview.lines
  if (lines.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Aucun frais configuré pour cette inscription.
      </div>
    )
  }

  return (
    <section
      aria-label="Aperçu de l'allocation"
      className="rounded-xl border border-border bg-muted/30 p-4"
    >
      <header className="flex items-center justify-between gap-2 pb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          Aperçu de l&apos;allocation
        </h3>
        <span className="text-xs text-muted-foreground">
          Reste à payer après : <strong>{formatFcfa(preview.total_remaining_after)}</strong>
        </span>
      </header>

      {!preview.can_record && preview.reject_reason ? (
        <div
          role="alert"
          className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>{preview.reject_reason}</p>
        </div>
      ) : null}

      <ul className="divide-y divide-border/60" role="list">
        {lines.map((line) => {
          const allocated = Number(line.allocated)
          const isContributing = allocated > 0
          return (
            <li
              key={line.enrollment_fee_id}
              className={cn(
                "flex items-center justify-between gap-3 py-2",
                !isContributing && "opacity-60",
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                {statusIcon(line.status_after)}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {line.fee_category_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFcfa(line.fee_paid_before)} / {formatFcfa(line.fee_total)}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    isContributing ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {isContributing ? `+ ${formatFcfa(allocated)}` : "—"}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {statusLabel(line.status_after)}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
