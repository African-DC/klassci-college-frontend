// Helpers d'affichage pour la mention scolaire (TB / B / AB / P / M).
// Source canonique pour la table bulletins, la modal preview, et tout futur PDF.

import type { Mention } from "@/lib/contracts/bulletin"

export const MENTION_FULL_LABEL: Record<Mention, string> = {
  TB: "Très bien",
  B: "Bien",
  AB: "Assez bien",
  P: "Passable",
  M: "Médiocre",
}

const PILL_CLASS_BY_MENTION: Record<Mention, string> = {
  TB: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  B: "bg-primary/10 text-primary ring-1 ring-primary/20",
  AB: "bg-accent/10 text-accent ring-1 ring-accent/20",
  P: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  M: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
}

export function getMentionBadgeClass(mention: Mention | null | undefined): string {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
  if (!mention) return `${base} bg-muted text-muted-foreground ring-1 ring-border`
  return `${base} ${PILL_CLASS_BY_MENTION[mention]}`
}

export function mentionFullLabel(mention: Mention | null | undefined): string {
  if (!mention) return "Aucune mention"
  return MENTION_FULL_LABEL[mention]
}
