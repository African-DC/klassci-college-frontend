import { cn } from "@/lib/utils"
import type { SettlementCell, SettlementState } from "@/lib/contracts/fee-settlement"

const fmt = (n: number) => `${n.toLocaleString("fr-FR")} F`

/**
 * Comment chaque état se montre : son mot, sa lettre, sa couleur.
 *
 * Un seul objet par état, et non trois tables parallèles indexées sur le même
 * type : c'est le genre de découpe où l'on ajoute un état à deux endroits sur
 * trois, et où la case sort sans couleur ou sans nom sans que rien ne le dise.
 * Ici l'oubli est impossible, le type l'exige.
 *
 * **La lettre n'est pas décorative.** Le tableau se consulte en plein soleil
 * sur un écran d'entrée de gamme, et un daltonien ne distingue pas l'ambre du
 * vert : la couleur ne doit jamais porter l'information toute seule. Le mot
 * suffirait, mais il tombe le premier quand la colonne se resserre.
 *
 * « Soldé » et « En nature » disent tous deux que plus rien n'est dû, et
 * restent deux mots distincts : l'école ne les traite pas pareil, et les
 * fondre ferait disparaître la question « a-t-il remis sa tenue ? ».
 */
const ETATS: Record<SettlementState, { label: string; mark: string; tone: string }> = {
  paid: {
    label: "Soldé",
    mark: "S",
    tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  partial: {
    label: "Partiel",
    mark: "P",
    tone: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  pending: {
    label: "Dû",
    mark: "D",
    tone: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  },
  in_kind: {
    label: "En nature",
    mark: "N",
    tone: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  waived: {
    label: "Exonéré",
    mark: "E",
    tone: "border-border bg-muted text-muted-foreground",
  },
  absent: {
    label: "—",
    mark: "",
    tone: "border-transparent bg-transparent text-muted-foreground/50",
  },
}

/**
 * L'état d'une catégorie de frais pour un élève.
 *
 * Le reste dû accompagne « Partiel ». Sans lui, il faudrait rouvrir la fiche
 * pour savoir combien réclamer, et le tableau ne servirait qu'à repérer les
 * dossiers, pas à préparer les relances.
 */
export function SettlementBadge({ cell, className }: { cell: SettlementCell; className?: string }) {
  const etat = ETATS[cell.state]

  // Une catégorie non facturée n'est pas un impayé : elle ne prend ni cadre ni
  // couleur, pour que l'œil ne s'arrête que sur ce qui appelle une action.
  if (cell.state === "absent") {
    return (
      <span className={cn("text-xs text-muted-foreground/50", className)} title="Non facturé">
        {etat.label}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-tight",
        etat.tone,
        className,
      )}
    >
      <span aria-hidden className="font-bold">
        {etat.mark}
      </span>
      <span>{etat.label}</span>
      {cell.state === "partial" && cell.remaining > 0 ? (
        <span className="tabular-nums opacity-80">· {fmt(cell.remaining)}</span>
      ) : null}
    </span>
  )
}
