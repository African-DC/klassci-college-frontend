"use client"

import { AlertTriangle, Eraser, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AllocationPreviewCard } from "@/components/admin/payments/AllocationPreviewCard"
import type { AllocationPreview } from "@/lib/contracts/payment"
import { AllocationModeChoice } from "./AllocationModeChoice"
import { AllocationTotalsBar } from "./AllocationTotalsBar"
import { FeeAllocationRow } from "./FeeAllocationRow"
import type { AllocationDraftController } from "./useAllocationDraft"

interface PaymentAllocationSectionProps {
  /** Montant du versement, tel qu'il est saisi au-dessus. */
  amount: number
  preview: AllocationPreview | undefined
  isLoading: boolean
  error: Error | null
  controller: AllocationDraftController
}

function ManualSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Chargement des frais">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement des frais de l&apos;inscription…
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

/**
 * Le choix de la répartition d'un versement, et sa saisie.
 *
 * Automatique par défaut : l'encaisseur qui ne veut rien décider ne voit
 * qu'un aperçu, exactement comme avant. Le mode manuel n'apparaît que s'il le
 * demande, et n'oblige jamais à tout répartir : ce qui n'est pas nommé repart
 * en cascade, et le compteur du bas le dit en toutes lettres.
 */
export function PaymentAllocationSection({
  amount,
  preview,
  isLoading,
  error,
  controller,
}: PaymentAllocationSectionProps) {
  const { mode, setMode, draft, setFeeAmount, fillFee, clear, plan } = controller
  const lignes = preview?.lines ?? []

  return (
    <section aria-label="Répartition du versement" className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Répartition du versement</p>
        <p className="text-xs text-muted-foreground">
          Choisissez qui reçoit l&apos;argent, ou laissez le système décider.
        </p>
      </div>

      <AllocationModeChoice value={mode} onChange={setMode} />

      {mode === "auto" ? (
        <AllocationPreviewCard preview={preview} isLoading={isLoading} error={error} />
      ) : isLoading && !preview ? (
        <ManualSkeleton />
      ) : error ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm"
        >
          <p className="font-medium text-destructive">
            Impossible de charger les frais de cette inscription
          </p>
          <p className="text-destructive/90">{error.message}</p>
        </div>
      ) : lignes.length === 0 ? (
        <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          Aucun frais configuré pour cette inscription.
        </p>
      ) : (
        <div className="space-y-3">
          {preview && !preview.can_record && preview.reject_reason ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-500/10 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:text-amber-200"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>{preview.reject_reason}</p>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Posez un montant sur les frais à régler. Laissez vide ce que vous ne
              voulez pas décider.
            </p>
            {plan.manualTotal > 0 ? (
              <Button
                type="button"
                variant="ghost"
                className="h-11 shrink-0 gap-1.5 px-2 text-xs sm:h-9"
                onClick={clear}
              >
                <Eraser className="h-3.5 w-3.5" aria-hidden />
                Tout effacer
              </Button>
            ) : null}
          </div>

          <div className="space-y-2">
            {plan.lines.map((line) => (
              <FeeAllocationRow
                key={line.enrollmentFeeId}
                line={line}
                value={draft[line.enrollmentFeeId] ?? ""}
                onChange={(raw) => setFeeAmount(line.enrollmentFeeId, raw)}
                onFill={() => fillFee(line.enrollmentFeeId)}
              />
            ))}
          </div>

          <AllocationTotalsBar plan={plan} amount={amount} />
        </div>
      )}
    </section>
  )
}
