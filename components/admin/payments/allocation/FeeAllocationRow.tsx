"use client"

import { AlertCircle, CornerDownRight, MinusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { AllocationPreviewLine } from "@/lib/contracts/payment"
import { formatXof } from "./format"

/**
 * Un frais, une carte, un champ.
 *
 * Jamais une ligne de tableau : sur un écran de 5,5 pouces, quatre colonnes
 * de saisie deviennent illisibles bien avant d'être utilisables. Chaque frais
 * occupe donc toute la largeur, avec son reste dû au-dessus du champ.
 *
 * Tous les nombres affichés viennent de l'aperçu du serveur. La carte ne
 * calcule ni le reste dû, ni la part cascadée, ni ce qui est refusé : elle les
 * lit.
 */
export function FeeAllocationRow({
  line,
  value,
  onChange,
  onFill,
  problem,
  disabled,
}: {
  line: AllocationPreviewLine
  value: string
  onChange: (raw: string) => void
  onFill: () => void
  /** Le motif de refus qui porte sur ce frais, rendu par l'aperçu. */
  problem?: string
  disabled?: boolean
}) {
  const inputId = `allocation-fee-${line.enrollment_fee_id}`
  const errorId = `${inputId}-error`
  const restant = line.cash_remaining_before
  // Ce que la cascade ajoute par-dessus ce qui a été nommé sur cette ligne.
  const cascade = Math.max(0, line.allocated - line.directed)

  if (restant <= 0 && line.directed <= 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
        <div className="flex items-start gap-2">
          <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {line.fee_category_name}
            </p>
            <p className="text-xs text-muted-foreground">
              Ce frais n&apos;attend plus d&apos;argent, rien ne peut y être imputé.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const solde = restant <= 0

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3",
        problem ? "border-destructive" : "border-border",
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <label htmlFor={inputId} className="min-w-0 text-sm font-medium text-foreground">
          {line.fee_category_name}
        </label>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {solde ? "Déjà soldé" : `Reste dû : ${formatXof(restant)}`}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="0"
          aria-invalid={problem ? true : undefined}
          aria-describedby={problem ? errorId : undefined}
          // text-base : en dessous de 16px, Chrome Android zoome sur le champ
          // au focus et l'écran part de travers. Les flèches natives sont
          // retirées, elles volent la moitié d'une cible tactile.
          className="h-11 flex-1 text-base font-semibold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <Button
          type="button"
          variant="outline"
          className="h-11 shrink-0 px-3 text-xs"
          disabled={disabled || solde}
          onClick={onFill}
        >
          Le maximum
          <span className="sr-only"> imputable sur {line.fee_category_name}</span>
        </Button>
      </div>

      {problem ? (
        <p
          id={errorId}
          role="alert"
          className="mt-2 flex items-start gap-1.5 text-xs font-medium text-destructive"
        >
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          {problem}
        </p>
      ) : null}

      {cascade > 0 ? (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <CornerDownRight className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          Le reste à répartir y ajoutera {formatXof(cascade)}.
        </p>
      ) : null}
    </div>
  )
}
