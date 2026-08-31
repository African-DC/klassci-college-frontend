"use client"

import type { UseFormReturn } from "react-hook-form"
import type { NewEnrollment, ReEnrollment } from "@/lib/contracts/enrollment"
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
  onSuccess: () => void
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

  function submit() {
    if (enrollmentType === "new") {
      newForm.handleSubmit((data) => {
        if (!showParentFields) data.parent = null
        data.in_kind_deposits = inKindDepositsPayload(inKindDeposits)
        createWithStudent.mutate(data, {
          onSuccess: async (enrollment) => {
            await attachPhoto.mutateAsync({ studentId: enrollment.student_id, photo })
            newForm.reset()
            onPhotoConsumed()
            onSuccess()
          },
        })
      })()
      return
    }

    reForm.handleSubmit((data) => {
      data.in_kind_deposits = inKindDepositsPayload(inKindDeposits)
      reEnroll.mutate(data, {
        onSuccess: () => {
          reForm.reset()
          onSuccess()
        },
      })
    })()
  }

  return {
    submit,
    isPending,
    submitLabel,
    createError: createWithStudent.error?.message,
    reEnrollError: reEnroll.error?.message,
  }
}
