"use client"

import { Badge } from "@/components/ui/badge"
import type { CashMethodTotal } from "@/lib/contracts/cash-session"
import { formatFcfa } from "@/lib/utils/money"

export { formatFcfa }

/**
 * L'écart de caisse est l'information que le comptable cherche en premier.
 * Le signe porte le sens : négatif = manquant, positif = excédent. Un écart
 * nul n'est pas neutre, c'est une bonne nouvelle — d'où le vert.
 */
export function VarianceBadge({ variance }: { variance: number | null | undefined }) {
  if (variance === null || variance === undefined) {
    return <span className="text-sm text-muted-foreground">—</span>
  }
  if (variance === 0) {
    return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600/90">Juste</Badge>
  }
  const isShort = variance < 0
  return (
    <Badge
      variant={isShort ? "destructive" : "secondary"}
      className={isShort ? undefined : "bg-amber-500 text-white hover:bg-amber-500/90"}
    >
      {isShort ? "Manquant" : "Excédent"} {formatFcfa(Math.abs(variance))}
    </Badge>
  )
}

export function CashStatusBadge({ status }: { status: string }) {
  if (status === "closed") {
    return <Badge variant="secondary">Clôturée</Badge>
  }
  return <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">Ouverte</Badge>
}

/**
 * Ventilation par moyen de paiement. Seuls les moyens réellement utilisés
 * sont rendus : afficher « Chèque 0 » sur une école qui n'en accepte pas
 * ajoute du bruit sans rien apprendre.
 */
export function MethodBreakdown({ methods }: { methods: CashMethodTotal[] }) {
  if (methods.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun encaissement pour l&apos;instant sur cette journée.
      </p>
    )
  }
  return (
    <ul className="space-y-2">
      {methods.map((m) => (
        <li
          key={m.method}
          className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5"
        >
          <span className="min-w-0">
            <span className="text-sm font-medium">{m.label}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {m.count} versement{m.count > 1 ? "s" : ""}
            </span>
          </span>
          <span className="shrink-0 text-sm font-semibold tabular-nums">
            {formatFcfa(m.total)}
          </span>
        </li>
      ))}
    </ul>
  )
}
