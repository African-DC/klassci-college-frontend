"use client"

import { AlertCircle, CornerDownRight, MinusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { PlanLine } from "@/lib/payments/allocation-plan"
import { formatXof } from "./format"

/**
 * Un frais, une carte, un champ.
 *
 * Jamais une ligne de tableau : sur un écran de 5,5 pouces, quatre colonnes
 * de saisie deviennent illisibles bien avant d'être utilisables. Chaque frais
 * occupe donc toute la largeur, avec son reste dû au-dessus du champ.
 */
export function FeeAllocationRow({
  line,
  value,
  onChange,
  onFill,
  disabled,
}: {
  line: PlanLine
  value: string
  onChange: (raw: string) => void
  onFill: () => void
  disabled?: boolean
}) {
  const inputId = `allocation-fee-${line.enrollmentFeeId}`
  const errorId = `${inputId}-error`

  if (!line.cashDue) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
        <div className="flex items-start gap-2">
          <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{line.name}</p>
            <p className="text-xs text-muted-foreground">
              Ce frais n&apos;est pas dû en argent, rien ne peut y être imputé.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const solde = line.due <= 0

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3",
        line.overDue ? "border-destructive" : "border-border",
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <label htmlFor={inputId} className="min-w-0 text-sm font-medium text-foreground">
          {line.name}
        </label>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {solde ? "Déjà soldé" : `Reste dû : ${formatXof(line.due)}`}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={0}
          max={line.due}
          step={1}
          disabled={disabled || solde}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="0"
          aria-invalid={line.overDue || undefined}
          aria-describedby={line.overDue ? errorId : undefined}
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
          <span className="sr-only"> imputable sur {line.name}</span>
        </Button>
      </div>

      {line.overDue ? (
        <p
          id={errorId}
          role="alert"
          className="mt-2 flex items-start gap-1.5 text-xs font-medium text-destructive"
        >
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          Ce frais ne doit plus que {formatXof(line.due)}.
        </p>
      ) : null}

      {line.auto > 0 ? (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <CornerDownRight className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          Le reste à répartir y ajoutera {formatXof(line.auto)}.
        </p>
      ) : null}
    </div>
  )
}
