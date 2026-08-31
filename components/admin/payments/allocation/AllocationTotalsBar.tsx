"use client"

import { AlertTriangle, CheckCircle2, Info } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { AllocationPlan } from "@/lib/payments/allocation-plan"
import { formatXof } from "./format"

function etat(plan: AllocationPlan, amount: number) {
  if (plan.overAllocated) {
    return {
      icon: AlertTriangle,
      tone: "text-destructive",
      alert: true,
      message: `Vous avez réparti ${formatXof(plan.manualTotal - amount)} de trop. Retirez ce montant avant d'enregistrer.`,
    }
  }
  if (plan.toDistribute === 0) {
    return {
      icon: CheckCircle2,
      tone: "text-emerald-600 dark:text-emerald-400",
      alert: false,
      message: "Tout le versement est réparti sur les frais que vous avez nommés.",
    }
  }
  if (plan.surplus > 0) {
    return {
      icon: AlertTriangle,
      tone: "text-amber-600 dark:text-amber-400",
      alert: false,
      message: `${formatXof(plan.autoTotal)} iront sur les frais dus restants. ${formatXof(plan.surplus)} ne correspondent à aucun frais dû.`,
    }
  }
  return {
    icon: Info,
    tone: "text-muted-foreground",
    alert: false,
    message:
      "Ce reste ira automatiquement sur les frais dus restants, du plus prioritaire au moins prioritaire.",
  }
}

/**
 * Le compteur de répartition, collé au bas de la boîte de dialogue.
 *
 * `sticky bottom-0` le maintient à l'écran pendant la saisie : sur un
 * téléphone dont le clavier mange la moitié de la hauteur, le montant qui
 * reste à répartir doit rester lisible sans refermer le clavier.
 */
export function AllocationTotalsBar({
  plan,
  amount,
}: {
  plan: AllocationPlan
  amount: number
}) {
  const pct = amount > 0 ? Math.min(100, Math.round((plan.manualTotal / amount) * 100)) : 0
  const { icon: Icon, tone, alert, message } = etat(plan, amount)

  return (
    <div
      className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-background/95 px-4 pt-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:-mx-6 sm:px-6"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm">
          <span className="text-muted-foreground">Réparti </span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatXof(plan.manualTotal)}
          </span>
          <span className="text-muted-foreground"> sur {formatXof(amount)}</span>
        </p>
        <p className="text-sm">
          <span className="text-muted-foreground">Reste à répartir </span>
          <span
            className={cn(
              "font-semibold tabular-nums",
              plan.toDistribute > 0 ? "text-accent" : "text-foreground",
            )}
          >
            {formatXof(plan.toDistribute)}
          </span>
        </p>
      </div>

      <Progress
        value={pct}
        className="mt-2 h-2"
        aria-label={`${pct} % du versement réparti à la main`}
      />

      <p
        role={alert ? "alert" : undefined}
        className={cn("mt-2 flex items-start gap-1.5 text-xs", tone)}
      >
        <Icon className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>{message}</span>
      </p>
    </div>
  )
}
