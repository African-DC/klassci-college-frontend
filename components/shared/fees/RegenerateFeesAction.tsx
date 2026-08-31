"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog"
import { useRegenerateFees } from "@/lib/hooks/useEnrollments"
import type { FeeLineCounts } from "@/lib/enrollment/fee-lines"
import { cn } from "@/lib/utils"

interface RegenerateFeesActionProps {
  /** Une inscription depuis sa fiche, toutes celles de l'élève depuis la sienne. */
  enrollmentIds: number[]
  /** Ce sur quoi porte le geste, dit à la personne : « Kouadio Awa, 6e A ». */
  subject: string
  /**
   * Ce que l'écran sait des lignes en place, ou `undefined` tant qu'il ne le
   * sait pas encore. Un décompte non chargé vaut zéro en mémoire, et zéro
   * s'affirme : on préfère dire qu'on ne sait pas encore, et laisser le
   * serveur annoncer ensuite ce qu'il a réellement fait.
   */
  feeLines?: FeeLineCounts
  className?: string
}

function ligne(n: number) {
  return n > 1 ? `${n} lignes` : `${n} ligne`
}

/**
 * « Régénérer les frais », le même sur la fiche élève et sur la fiche
 * inscription.
 *
 * Le geste réécrit des lignes de frais : il passe donc par une confirmation qui
 * dit ce qui va réellement arriver, pas « Êtes-vous sûr ? ». Ce qui porte un
 * versement est conservé, le reste est refabriqué depuis les tarifs en vigueur.
 */
export function RegenerateFeesAction({
  enrollmentIds,
  subject,
  feeLines,
  className,
}: RegenerateFeesActionProps) {
  const [open, setOpen] = useState(false)
  const { mutate, isPending } = useRegenerateFees()

  if (enrollmentIds.length === 0) return null

  const plusieurs = enrollmentIds.length > 1

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={cn("h-11 w-full sm:h-10 sm:w-auto", className)}
        disabled={isPending}
        onClick={() => setOpen(true)}
      >
        <RefreshCw className={cn("mr-1.5 h-4 w-4", isPending && "animate-spin")} />
        {isPending ? "Régénération..." : "Régénérer les frais"}
      </Button>

      <ConfirmActionDialog
        open={open}
        onOpenChange={(next) => {
          if (!isPending) setOpen(next)
        }}
        tone="warning"
        title={plusieurs ? "Régénérer les frais de cet élève ?" : "Régénérer les frais de cette inscription ?"}
        description={`Les frais de ${subject} sont refabriqués à partir des tarifs en vigueur aujourd'hui. Les lignes sur lesquelles aucun versement n'a été imputé sont remplacées ; celles qui portent déjà un versement sont conservées telles quelles.`}
        details={
          <>
            {feeLines ? (
              <>
                <p>
                  {feeLines.withoutPayments === 0 ? (
                    "Aucune ligne sans versement : rien à remplacer."
                  ) : (
                    <>
                      <span className="font-semibold">{ligne(feeLines.withoutPayments)}</span> sans
                      versement, donc remplacée{feeLines.withoutPayments > 1 ? "s" : ""}.
                    </>
                  )}
                </p>
                <p>
                  {feeLines.withPayments === 0 ? (
                    "Aucune ligne ne porte de versement."
                  ) : (
                    <>
                      <span className="font-semibold">{ligne(feeLines.withPayments)}</span> avec un
                      versement, donc conservée{feeLines.withPayments > 1 ? "s" : ""}.
                    </>
                  )}
                </p>
                {feeLines.settledWithoutCash > 0 ? (
                  <p className="text-muted-foreground">
                    {ligne(feeLines.settledWithoutCash)} exonérée
                    {feeLines.settledWithoutCash > 1 ? "s" : ""} ou déposée
                    {feeLines.settledWithoutCash > 1 ? "s" : ""} en nature : soldée
                    {feeLines.settledWithoutCash > 1 ? "s" : ""} sans versement, hors des deux
                    décomptes ci-dessus.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-muted-foreground">
                Les lignes de frais ne sont pas encore chargées : impossible de dire ici combien
                seront remplacées. Le serveur l&apos;annoncera une fois le geste fait.
              </p>
            )}
            {plusieurs ? (
              <p className="text-muted-foreground">
                Les {enrollmentIds.length} inscriptions de l&apos;élève sont traitées.
              </p>
            ) : null}
            <p className="text-muted-foreground">
              Le montant dû peut changer : c&apos;est le tarif d&apos;aujourd&apos;hui qui
              s&apos;applique, y compris ce qui dépend du profil de l&apos;inscription.
            </p>
          </>
        }
        confirmLabel="Régénérer les frais"
        pendingLabel="Régénération..."
        pending={isPending}
        onConfirm={() =>
          mutate(enrollmentIds, {
            onSettled: () => setOpen(false),
          })
        }
      />
    </>
  )
}
