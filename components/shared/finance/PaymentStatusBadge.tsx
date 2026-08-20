import { CalendarClock, CircleAlert, CircleCheck } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * État de paiement sans montant.
 *
 * Affiché à qui a `payments:status:read` mais pas `payments:read` : il doit
 * pouvoir valider un dossier d'inscription sans jamais apprendre combien la
 * famille doit, parce que cette somme dit la situation économique du foyer.
 */
const STATES = {
  a_jour: {
    label: "À jour",
    hint: "Les échéances arrivées à terme sont réglées",
    icon: CircleCheck,
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  },
  en_retard: {
    label: "En retard",
    hint: "Une échéance arrivée à terme reste due",
    icon: CircleAlert,
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  },
  sans_echeancier: {
    label: "Sans échéancier",
    hint: "Aucune grille de tranches n'est configurée",
    icon: CalendarClock,
    className: "bg-muted text-muted-foreground",
  },
} as const

interface PaymentStatusBadgeProps {
  status: string | null | undefined
  lastPaymentDate?: string | null
  /** Sur fond coloré (bandeau élève), le badge passe en verre blanc. */
  onHero?: boolean
  className?: string
}

export function PaymentStatusBadge({
  status,
  lastPaymentDate,
  onHero = false,
  className,
}: PaymentStatusBadgeProps) {
  const state = STATES[status as keyof typeof STATES]
  if (!state) return null

  const Icon = state.icon
  const formatted = lastPaymentDate
    ? new Date(lastPaymentDate).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span
        title={state.hint}
        className={cn(
          "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
          onHero ? "bg-white/15 text-white" : state.className,
        )}
      >
        <Icon aria-hidden="true" className="h-3.5 w-3.5" />
        {state.label}
      </span>
      {formatted ? (
        <span className={cn("text-xs", onHero ? "text-white/70" : "text-muted-foreground")}>
          Dernier versement le {formatted}
        </span>
      ) : null}
    </div>
  )
}
