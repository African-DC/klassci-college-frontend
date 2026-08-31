"use client"

import { AlertCircle, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  formatDebtDelta,
  propagationBuckets,
  type FeePropagationPreview,
  type FeePropagationResult,
} from "@/lib/contracts/fee-propagation"
import { cn } from "@/lib/utils"

export function ChargementApercu() {
  return (
    <div className="space-y-3" aria-live="polite" aria-busy="true">
      <span className="sr-only">Calcul de l&apos;impact en cours</span>
      <Skeleton className="h-14 w-full rounded-lg" />
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-11 w-full rounded-md" />
    </div>
  )
}

export function EtatErreur({
  message,
  onRetry,
  isRetrying,
  onClose,
}: {
  message: string
  onRetry: () => void
  isRetrying: boolean
  onClose: () => void
}) {
  return (
    <>
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
        <AlertCircle
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        />
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            L&apos;impact n&apos;a pas pu être calculé.
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-200">{message}</p>
          <p className="text-xs text-amber-800 dark:text-amber-200">
            Aucune inscription n&apos;a été modifiée.
          </p>
        </div>
      </div>
      <PiedDePage>
        <Button type="button" variant="outline" className="h-11 sm:h-10" onClick={onClose}>
          Fermer
        </Button>
        <Button type="button" className="h-11 sm:h-10" onClick={onRetry} disabled={isRetrying}>
          {isRetrying ? "Nouveau calcul..." : "Réessayer"}
        </Button>
      </PiedDePage>
    </>
  )
}

export function EtatVide({ nom, onClose }: { nom: string; onClose: () => void }) {
  return (
    <>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
        <Users className="mb-2 h-8 w-8 text-muted-foreground opacity-40" aria-hidden="true" />
        <p className="text-sm font-medium">Aucune inscription ne porte ce tarif</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          Le nouveau montant de {nom} s&apos;appliquera aux inscriptions à venir. Il n&apos;y a
          rien à répercuter.
        </p>
      </div>
      <PiedDePage>
        <Button type="button" className="h-11 sm:h-10" onClick={onClose}>
          Fermer
        </Button>
      </PiedDePage>
    </>
  )
}

export function TarifConcerne({ nom, montant }: { nom: string; montant: number }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Frais concerné
      </p>
      <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-sm font-semibold">
        <span className="truncate">{nom}</span>
        <span className="tabular-nums">{montant.toLocaleString("fr-FR")} FCFA</span>
      </p>
    </div>
  )
}

/**
 * La répartition, paquet par paquet, sous le total qu'elle doit reconstituer.
 *
 * Les paquets viennent du contrat, pas d'ici : leur somme vaut le total
 * annoncé, et un paquet muet ferait mentir la ligne du dessus.
 */
export function Compteurs({
  compteurs,
}: {
  compteurs: FeePropagationPreview | FeePropagationResult
}) {
  const concernees = compteurs.enrollments_concerned
  const paquets = propagationBuckets(compteurs).filter((p) => p.emphase || p.count > 0)

  return (
    <div className="space-y-3">
      <p className="text-sm">
        <span className="font-semibold tabular-nums">{concernees}</span> inscription
        {concernees > 1 ? "s" : ""} port
        {concernees > 1 ? "ent" : "e"} ce tarif cette année.
      </p>

      <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
        {paquets.map((paquet) => (
          <Ligne
            key={paquet.key}
            libelle={paquet.label}
            valeur={paquet.count}
            detail={paquet.detail}
            ton={paquet.emphase ? "fort" : undefined}
          />
        ))}
      </ul>

      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5">
        <span className="text-sm font-medium">Écart de dette</span>
        <span
          className={cn(
            "text-sm font-bold tabular-nums",
            compteurs.debt_delta > 0 && "text-amber-700 dark:text-amber-300",
            compteurs.debt_delta < 0 && "text-emerald-700 dark:text-emerald-300",
          )}
        >
          {formatDebtDelta(compteurs.debt_delta)}
        </span>
      </div>
    </div>
  )
}

function Ligne({
  libelle,
  valeur,
  detail,
  ton,
}: {
  libelle: string
  valeur: number
  detail?: string
  ton?: "fort"
}) {
  return (
    <li className="flex items-start justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0">
        <p className={cn("text-sm", ton === "fort" && "font-medium")}>{libelle}</p>
        {detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}
      </div>
      <span
        className={cn(
          "shrink-0 text-sm tabular-nums",
          ton === "fort" ? "font-bold" : "font-semibold text-muted-foreground",
        )}
      >
        {valeur}
      </span>
    </li>
  )
}

export function PiedDePage({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{children}</div>
}
