"use client"

import { Badge } from "@/components/ui/badge"
import { CASH_STATUS, type CashMethodTotal } from "@/lib/contracts/cash-session"
import { formatFcfa } from "@/lib/utils/money"

export { formatFcfa }

/**
 * « 2026-08-20 » devient « 20/08/2026 ». Découpage manuel plutôt que `new
 * Date(iso)` : ce dernier interprète une date nue comme minuit UTC et affiche
 * la veille dans les fuseaux négatifs.
 */
export function formatBusinessDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-")
  if (!year || !month || !day) return isoDate
  return `${day}/${month}/${year}`
}

/**
 * L'écart de caisse est l'information que le comptable cherche en premier.
 * Le signe porte le sens : négatif = manquant, positif = excédent. Un écart
 * nul n'est pas neutre, c'est une bonne nouvelle — d'où le vert.
 */
export function VarianceBadge({ variance }: { variance: number | null | undefined }) {
  if (variance === null || variance === undefined) {
    // Écart inconnu, faute de comptage. Le tiret dit « on ne sait pas » ;
    // afficher « Juste » ou « 0 » affirmerait que le tiroir tombait juste.
    return <span className="text-sm text-muted-foreground">Inconnu</span>
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
  if (status === CASH_STATUS.CLOSED) {
    return <Badge variant="secondary">Clôturée</Badge>
  }
  if (status === CASH_STATUS.AUTO_CLOSED) {
    // Ambre et non gris : la journée est arrêtée, mais il reste un geste à
    // faire. La confondre visuellement avec une clôture normale la ferait
    // oublier.
    return (
      <Badge className="bg-amber-500 text-white hover:bg-amber-500/90">Clôturée d&apos;office</Badge>
    )
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
