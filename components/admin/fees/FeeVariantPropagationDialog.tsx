"use client"

import { AlertCircle, ArrowRightLeft, CheckCircle2, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useFeePropagationPreview, usePropagateFeeVariant } from "@/lib/hooks/useFees"
import { formatDebtDelta, type FeeVariant } from "@/lib/contracts/fee"
import { cn } from "@/lib/utils"

interface FeeVariantPropagationDialogProps {
  /** Le tarif dont le montant vient de changer, ou `null` quand le dialogue est fermé. */
  variant: FeeVariant | null
  onClose: () => void
}

/**
 * Propose de répercuter un tarif corrigé sur les inscriptions déjà enregistrées.
 *
 * L'école voit l'impact chiffré AVANT de trancher : combien d'inscriptions
 * portent ce tarif, combien de lignes seraient réécrites, combien resteraient
 * en l'état parce qu'un versement y est imputé, et de combien la dette totale
 * bougerait.
 *
 * Ce dialogue n'emprunte pas `DestructiveActionDialog` : celui-ci exige un
 * motif écrit puis un appui maintenu, réservés aux gestes qui ne se rattrapent
 * pas. Répercuter ne détruit rien et se rejoue sans dommage ; imposer la même
 * cérémonie ferait passer le refus pour le choix prudent, alors que les deux
 * réponses sont également légitimes.
 */
export function FeeVariantPropagationDialog({
  variant,
  onClose,
}: FeeVariantPropagationDialogProps) {
  const {
    data: apercu,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useFeePropagationPreview(variant?.id ?? null)
  const { mutate, isPending, data: resultat, reset } = usePropagateFeeVariant()

  function fermer() {
    reset()
    onClose()
  }

  return (
    <Dialog open={!!variant} onOpenChange={(open) => { if (!open) fermer() }}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm",
                resultat
                  ? "bg-gradient-to-br from-emerald-600 to-emerald-500"
                  : "bg-gradient-to-br from-primary to-primary/80",
              )}
            >
              {resultat ? (
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              ) : (
                <ArrowRightLeft className="h-5 w-5" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-base">
                {resultat ? "Répercussion effectuée" : "Répercuter ce montant ?"}
              </DialogTitle>
              <DialogDescription>
                {resultat
                  ? "Les dettes concernées portent désormais le nouveau montant."
                  : "Les élèves déjà inscrits gardent l'ancien montant tant que vous ne l'avez pas décidé."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <ChargementApercu />
        ) : isError ? (
          <EtatErreur
            message={error instanceof Error ? error.message : "Impossible de calculer l'impact."}
            onRetry={() => void refetch()}
            isRetrying={isFetching}
            onClose={fermer}
          />
        ) : resultat ? (
          <>
            <TarifConcerne nom={resultat.category_name} montant={resultat.amount} />
            <Compteurs
              lignesTitre="Lignes mises à jour"
              lignes={resultat.fees_updated}
              conservees={resultat.fees_kept_with_payments}
              dejaAJour={resultat.fees_already_up_to_date}
              exonerees={resultat.fees_waived}
              concernees={resultat.enrollments_concerned}
              ecart={resultat.debt_delta}
            />
            <PiedDePage>
              <Button type="button" className="h-11 sm:h-10" onClick={fermer}>
                Fermer
              </Button>
            </PiedDePage>
          </>
        ) : apercu && apercu.enrollments_concerned === 0 ? (
          <EtatVide nom={apercu.category_name} onClose={fermer} />
        ) : apercu ? (
          <>
            <TarifConcerne nom={apercu.category_name} montant={apercu.amount} />
            <Compteurs
              lignesTitre="Lignes à mettre à jour"
              lignes={apercu.fees_to_update}
              conservees={apercu.fees_kept_with_payments}
              dejaAJour={apercu.fees_already_up_to_date}
              exonerees={apercu.fees_waived}
              concernees={apercu.enrollments_concerned}
              ecart={apercu.debt_delta}
            />
            <PiedDePage>
              <Button
                type="button"
                variant="outline"
                className="h-11 sm:h-10"
                onClick={fermer}
                disabled={isPending}
              >
                Non, ne rien changer
              </Button>
              <Button
                type="button"
                className="h-11 sm:h-10"
                disabled={isPending || apercu.fees_to_update === 0}
                onClick={() => variant && mutate(variant.id)}
              >
                {isPending ? "Répercussion..." : "Oui, répercuter"}
              </Button>
            </PiedDePage>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Morceaux d'écran
// ---------------------------------------------------------------------------

function ChargementApercu() {
  return (
    <div className="space-y-3" aria-live="polite" aria-busy="true">
      <span className="sr-only">Calcul de l&apos;impact en cours</span>
      <Skeleton className="h-14 w-full rounded-lg" />
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-11 w-full rounded-md" />
    </div>
  )
}

function EtatErreur({
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

function EtatVide({ nom, onClose }: { nom: string; onClose: () => void }) {
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

function TarifConcerne({ nom, montant }: { nom: string; montant: number }) {
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

function Compteurs({
  lignesTitre,
  lignes,
  conservees,
  dejaAJour,
  exonerees,
  concernees,
  ecart,
}: {
  lignesTitre: string
  lignes: number
  conservees: number
  dejaAJour: number
  exonerees: number
  concernees: number
  ecart: number
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm">
        <span className="font-semibold tabular-nums">{concernees}</span> inscription
        {concernees > 1 ? "s" : ""} port
        {concernees > 1 ? "ent" : "e"} ce tarif cette année.
      </p>

      <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
        <Ligne
          libelle={lignesTitre}
          valeur={lignes}
          ton="fort"
        />
        {conservees > 0 && (
          <Ligne
            libelle="Conservées, un versement y est imputé"
            valeur={conservees}
            detail="Le reçu déjà remis à la famille reste vrai."
          />
        )}
        {dejaAJour > 0 && <Ligne libelle="Déjà au bon montant" valeur={dejaAJour} />}
        {exonerees > 0 && <Ligne libelle="Exonérées" valeur={exonerees} />}
      </ul>

      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5">
        <span className="text-sm font-medium">Écart de dette</span>
        <span
          className={cn(
            "text-sm font-bold tabular-nums",
            ecart > 0 && "text-amber-700 dark:text-amber-300",
            ecart < 0 && "text-emerald-700 dark:text-emerald-300",
          )}
        >
          {formatDebtDelta(ecart)}
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

function PiedDePage({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{children}</div>
}
