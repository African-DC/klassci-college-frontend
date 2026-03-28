"use client"

import { Badge } from "@/components/ui/badge"
import type { CouncilDecision } from "@/lib/contracts/council"

// Configuration des décisions avec couleurs sémantiques
const decisionConfig: Record<
  CouncilDecision,
  { label: string; className: string }
> = {
  passage: {
    label: "Passage",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200",
  },
  repechage: {
    label: "Repêchage",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200",
  },
  redoublement: {
    label: "Redoublement",
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200",
  },
  exclusion: {
    label: "Exclusion",
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200",
  },
}

export function CouncilDecisionBadge({ decision }: { decision: CouncilDecision | null }) {
  if (!decision) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Non décidé
      </Badge>
    )
  }

  const config = decisionConfig[decision]
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
