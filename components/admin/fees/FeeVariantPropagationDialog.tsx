"use client"

import { useState } from "react"
import { ArrowRightLeft, CheckCircle2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  ChargementApercu,
  Compteurs,
  EtatErreur,
  EtatVide,
  OptionCreation,
  PiedDePage,
  TarifConcerne,
} from "./FeeVariantPropagationParts"
import { useFeePropagationPreview, usePropagateFeeVariant } from "@/lib/hooks/useFees"
import type { FeeVariant } from "@/lib/contracts/fee"
import { propagationWriteCount } from "@/lib/contracts/fee-propagation"
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
 * portent ce tarif, combien de lignes seraient réécrites, combien seraient
 * créées, combien resteraient en l'état parce qu'un versement y est imputé, et
 * de combien la dette totale bougerait.
 *
 * Les lignes créées sont dites à part des lignes corrigées, et non fondues
 * dans un total de « lignes touchées » : corriger un montant modifie une dette
 * que la famille connaît, en créer une la fait apparaître chez une famille qui
 * n'en avait pas. La seconde se découvre sinon sur la facture.
 *
 * Ce sont donc deux gestes, et le second se demande. Confirmer répercute les
 * montants et rien d'autre ; les lignes manquantes ne sont créées que si
 * l'école a coché la case, qui dit combien de familles verront une dette
 * apparaître. Corriger une faute de frappe sur le prix de la tenue ne facture
 * ainsi personne.
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
  // Décoché à chaque ouverture : la création ne s'obtient qu'en la demandant,
  // et une case qui garderait son état d'hier facturerait la fois d'après.
  const [creerManquantes, setCreerManquantes] = useState(false)

  function fermer() {
    reset()
    setCreerManquantes(false)
    onClose()
  }

  const aCreer = apercu?.fees_to_create ?? 0
  const aEcrire = apercu ? propagationWriteCount(apercu, creerManquantes) : 0

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
            <Compteurs compteurs={resultat} />
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
            <Compteurs compteurs={apercu} />
            <OptionCreation
              crees={aCreer}
              coche={creerManquantes}
              onChange={setCreerManquantes}
              disabled={isPending}
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
                // Rien à écrire, ni correction ni création demandée : le bouton
                // ne promet pas un geste qui ne changerait rien.
                disabled={isPending || aEcrire === 0}
                onClick={() =>
                  variant && mutate({ variantId: variant.id, createMissing: creerManquantes })
                }
              >
                {isPending
                  ? "Répercussion..."
                  : creerManquantes
                    ? `Répercuter et créer ${aCreer} ligne${aCreer > 1 ? "s" : ""}`
                    : "Oui, répercuter les montants"}
              </Button>
            </PiedDePage>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
