"use client"

import type { UseFormReturn } from "react-hook-form"
import { asEnrollmentBlocked } from "@/lib/contracts/enrollment"
import type { Enrollment, NewEnrollment, ReEnrollment } from "@/lib/contracts/enrollment"
import { useCreateWithStudent, useReEnroll } from "@/lib/hooks/useEnrollments"
import { useAttachStudentPhoto } from "@/lib/hooks/useStudentPhoto"
import { inKindDepositsPayload, type EnrollmentType } from "@/components/forms/enrollment-wizard"

interface UseEnrollmentSubmitOptions {
  enrollmentType: EnrollmentType | null
  newForm: UseFormReturn<NewEnrollment>
  reForm: UseFormReturn<ReEnrollment>
  /** Sans parent saisi, on n'envoie pas une coquille vide au serveur. */
  showParentFields: boolean
  inKindDeposits: Record<number, boolean>
  photo: File | null
  onPhotoConsumed: () => void
  /** Rend l'inscription créée : l'écran enchaîne sur son encaissement. */
  onSuccess: (enrollment: Enrollment) => void
}

/**
 * L'envoi de l'inscription, séparé de l'écran qui la saisit.
 *
 * Deux chemins pour un même geste : créer l'élève et son inscription, ou
 * réinscrire un élève déjà connu. Le libellé du bouton suit l'appel en cours,
 * parce que l'envoi de la photo prend le temps qu'il prend sur un réseau
 * intermittent et que l'écran doit dire où il en est.
 */
export function useEnrollmentSubmit({
  enrollmentType,
  newForm,
  reForm,
  showParentFields,
  inKindDeposits,
  photo,
  onPhotoConsumed,
  onSuccess,
}: UseEnrollmentSubmitOptions) {
  const createWithStudent = useCreateWithStudent()
  const reEnroll = useReEnroll()
  const attachPhoto = useAttachStudentPhoto()

  const isPending = createWithStudent.isPending || reEnroll.isPending || attachPhoto.isPending

  const submitLabel = attachPhoto.isPending
    ? "Envoi de la photo..."
    : isPending
      ? "Enregistrement..."
      : "Enregistrer l'inscription"

  // Le refus pour dette d'un exercice précédent, reconnu parmi les erreurs.
  // C'est le serveur qui a tranché, montant et droit de dérogation compris :
  // l'écran lit son verdict et ne le recalcule pas.
  const blocked =
    asEnrollmentBlocked(createWithStudent.error) ?? asEnrollmentBlocked(reEnroll.error)

  /**
   * Envoie l'inscription. Le motif n'accompagne que la seconde tentative,
   * celle qui suit un refus, et le serveur la rejette de nouveau s'il est vide.
   */
  function submit(overrideReason?: string) {
    if (enrollmentType === "new") {
      newForm.handleSubmit((data) => {
        if (!showParentFields) data.parent = null
        data.in_kind_deposits = inKindDepositsPayload(inKindDeposits)
        createWithStudent.mutate(
          { data, overrideReason },
          {
            onSuccess: async (enrollment) => {
              await attachPhoto.mutateAsync({ studentId: enrollment.student_id, photo })
              newForm.reset()
              onPhotoConsumed()
              onSuccess(enrollment)
            },
          },
        )
      })()
      return
    }

    reForm.handleSubmit((data) => {
      data.in_kind_deposits = inKindDepositsPayload(inKindDeposits)
      reEnroll.mutate(
        { data, overrideReason },
        {
          onSuccess: (enrollment) => {
            reForm.reset()
            onSuccess(enrollment)
          },
        },
      )
    })()
  }

  return {
    submit,
    isPending,
    submitLabel,
    blocked,
    // Le refus pour dette s'affiche à part, avec son montant et sa dérogation :
    // le répéter en texte brut au-dessus le dirait deux fois.
    createError: blocked ? undefined : createWithStudent.error?.message,
    reEnrollError: blocked ? undefined : reEnroll.error?.message,
  }
}
