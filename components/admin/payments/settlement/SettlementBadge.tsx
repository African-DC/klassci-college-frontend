import { cn } from "@/lib/utils"
import {
  SETTLEMENT_LABEL,
  SETTLEMENT_MARK,
  type SettlementCell,
  type SettlementState,
} from "@/lib/contracts/fee-settlement"

const fmt = (n: number) => `${n.toLocaleString("fr-FR")} F`

/**
 * Le ton de chaque état. La couleur aide, elle ne porte jamais l'information
 * seule : le tableau se consulte en plein soleil sur un écran d'entrée de
 * gamme, et un daltonien ne distingue pas l'ambre du vert. Chaque case garde
 * donc son mot, et sa lettre quand la place manque.
 */
const TONE: Record<SettlementState, string> = {
  paid: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  partial: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  pending: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  in_kind: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  waived: "border-border bg-muted text-muted-foreground",
  absent: "border-transparent bg-transparent text-muted-foreground/50",
}

/**
 * L'état d'une catégorie pour un élève.
 *
 * « Soldé » et « En nature » disent tous deux que plus rien n'est dû, et
 * l'écran refuse de les fondre : l'école ne les traite pas pareil, et la
 * question « a-t-il remis sa tenue ? » disparaîtrait avec la distinction.
 *
 * Le reste dû accompagne « Partiel ». Sans lui, il faudrait rouvrir la fiche
 * pour savoir combien réclamer, et le tableau ne servirait qu'à repérer les
 * dossiers, pas à préparer les relances.
 */
export function SettlementBadge({ cell, className }: { cell: SettlementCell; className?: string }) {
  const label = SETTLEMENT_LABEL[cell.state]

  if (cell.state === "absent") {
    return (
      <span className={cn("text-xs text-muted-foreground/50", className)} title="Non facturé">
        {label}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-tight",
        TONE[cell.state],
        className,
      )}
    >
      <span aria-hidden className="font-bold">
        {SETTLEMENT_MARK[cell.state]}
      </span>
      <span>{label}</span>
      {cell.state === "partial" && cell.remaining > 0 ? (
        <span className="tabular-nums opacity-80">· {fmt(cell.remaining)}</span>
      ) : null}
    </span>
  )
}
