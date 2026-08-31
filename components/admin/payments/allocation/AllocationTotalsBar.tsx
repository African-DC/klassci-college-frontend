"use client"

import { AlertTriangle, CheckCircle2, Info } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { AllocationPreview } from "@/lib/contracts/payment"
import { formatXof } from "./format"

function etat(preview: AllocationPreview | undefined, amount: number, reparti: number) {
  const global = preview?.problems.find((p) => p.enrollment_fee_id === null)
  if (global) {
    return {
      icon: AlertTriangle,
      tone: "text-destructive",
      alert: true,
      message: global.message,
    }
  }
  if (reparti > amount) {
    // L'aperçu n'a pas encore rattrapé la frappe : on le dit sans chiffrer une
    // répartition que le serveur n'a pas validée.
    return {
      icon: AlertTriangle,
      tone: "text-destructive",
      alert: true,
      message: `Vous avez réparti ${formatXof(reparti - amount)} de trop. Retirez ce montant avant d'enregistrer.`,
    }
  }
  if (reparti === amount && amount > 0) {
    return {
      icon: CheckCircle2,
      tone: "text-emerald-600 dark:text-emerald-400",
      alert: false,
      message: "Tout le versement est réparti sur les frais que vous avez nommés.",
    }
  }
  if (preview && preview.surplus > 0) {
    return {
      icon: AlertTriangle,
      tone: "text-amber-600 dark:text-amber-400",
      alert: false,
      message: `${formatXof(preview.cascaded_total)} iront sur les frais dus restants. ${formatXof(preview.surplus)} ne correspondent à aucun frais dû.`,
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
 *
 * Le montant réparti suit la frappe, la part cascadée et le surplus viennent
 * de l'aperçu. C'est volontaire : ce que l'encaisseur vient de taper doit
 * s'afficher tout de suite, ce que le serveur en fait est ce que le serveur
 * en dit.
 */
export function AllocationTotalsBar({
  preview,
  amount,
  reparti,
}: {
  preview: AllocationPreview | undefined
  amount: number
  reparti: number
}) {
  const reste = Math.max(0, amount - reparti)
  const pct = amount > 0 ? Math.min(100, Math.round((reparti / amount) * 100)) : 0
  const { icon: Icon, tone, alert, message } = etat(preview, amount, reparti)

  return (
    <div
      className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-background/95 px-4 pt-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:-mx-6 sm:px-6"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm">
          <span className="text-muted-foreground">Réparti </span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatXof(reparti)}
          </span>
          <span className="text-muted-foreground"> sur {formatXof(amount)}</span>
        </p>
        <p className="text-sm">
          <span className="text-muted-foreground">Reste à répartir </span>
          <span
            className={cn(
              "font-semibold tabular-nums",
              reste > 0 ? "text-accent" : "text-foreground",
            )}
          >
            {formatXof(reste)}
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
