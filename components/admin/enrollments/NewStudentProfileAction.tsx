"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog"
import { NewStudentChoiceGroup } from "@/components/forms/NewStudentChoiceGroup"
import { invalidateEnrollmentFeeViews, useUpdateEnrollment } from "@/lib/hooks/useEnrollments"
import { newStudentLabel, type Enrollment } from "@/lib/contracts/enrollment"

/**
 * Corriger le profil d'une inscription déjà créée.
 *
 * Une inscription saisie avant que l'école ne connaisse la réponse reste
 * fausse tant que personne ne peut la reprendre : la fiche annonçait le manque
 * à gagner sans offrir de le corriger. Le geste vit ici, à côté du badge qu'il
 * change.
 *
 * Corriger le profil régénère les frais, comme un changement de classe. La
 * confirmation le dit avant de valider, pas après.
 */
export function NewStudentProfileAction({ enrollment }: { enrollment: Enrollment }) {
  const current = enrollment.is_new_student ?? null
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState<boolean | null>(current)
  const queryClient = useQueryClient()
  const { mutate, isPending } = useUpdateEnrollment(enrollment.id)

  function ouvrir() {
    setChoice(current)
    setOpen(true)
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-11 w-full sm:h-9 sm:w-auto"
        onClick={ouvrir}
      >
        <Pencil className="mr-1.5 h-3.5 w-3.5" />
        Corriger le profil
      </Button>

      <ConfirmActionDialog
        open={open}
        onOpenChange={(next) => {
          if (!isPending) setOpen(next)
        }}
        tone="warning"
        title="Corriger le profil de cette inscription ?"
        description={`Le profil décide des frais réservés aux nouveaux élèves et de ceux réservés aux anciens. Le corriger refabrique les frais de cette inscription : les lignes sans versement sont remplacées, celles qui en portent un sont conservées. Actuellement : ${newStudentLabel(current)}.`}
        details={
          <>
            <NewStudentChoiceGroup
              value={choice}
              onChange={setChoice}
              allowUndecided
              disabled={isPending}
            />
            <p className="text-muted-foreground">
              Le montant dû peut changer, et la famille le verra sur sa facture.
            </p>
          </>
        }
        confirmLabel="Corriger et régénérer les frais"
        pendingLabel="Enregistrement..."
        pending={isPending}
        confirmDisabled={choice === current}
        onConfirm={() =>
          mutate(
            { is_new_student: choice },
            {
              onSuccess: () => invalidateEnrollmentFeeViews(queryClient, [enrollment.id]),
              onSettled: () => setOpen(false),
            },
          )
        }
      />
    </>
  )
}
