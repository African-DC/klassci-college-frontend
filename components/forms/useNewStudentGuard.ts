"use client"

import { useEffect, useRef } from "react"
import type { UseFormReturn } from "react-hook-form"
import type { NewEnrollment, ReEnrollment } from "@/lib/contracts/enrollment"
import {
  PROFILE_REQUIRED_MESSAGE,
  newStudentAnswered,
  type EnrollmentType,
} from "@/components/forms/enrollment-wizard"

interface UseNewStudentGuardOptions {
  enrollmentType: EnrollmentType | null
  newForm: UseFormReturn<NewEnrollment>
  reForm: UseFormReturn<ReEnrollment>
  /** L'élève d'une réinscription. Absent quand le formulaire le crée lui-même. */
  studentId?: number
}

/**
 * Le profil d'inscription ne quitte jamais le formulaire sans réponse.
 *
 * Deux garde-fous, parce que deux choses distinctes peuvent mal tourner :
 *
 * 1. Changer d'élève remet le profil à zéro, comme changer de classe fait
 *    tomber les dépôts en nature. Sans cela, l'inscription du second élève
 *    partirait avec la réponse donnée pour le premier, donc avec ses frais.
 * 2. Le schéma laisse passer `null` — c'est une valeur légitime côté serveur —
 *    donc c'est ici qu'on refuse d'envoyer sans réponse. Tant que l'école n'a
 *    pas déclaré son historique exploitable, le serveur ne suggère rien : une
 *    valeur par défaut silencieuse facturerait de travers, et personne ne s'en
 *    apercevrait avant la facture.
 */
export function useNewStudentGuard({
  enrollmentType,
  newForm,
  reForm,
  studentId,
}: UseNewStudentGuardOptions) {
  const lastStudentId = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (lastStudentId.current === studentId) return
    lastStudentId.current = studentId
    reForm.setValue("is_new_student", null)
    reForm.clearErrors("is_new_student")
  }, [studentId, reForm])

  /** `true` si la question est tranchée. Sinon, pose le message sur le champ. */
  return function ensureProfileAnswered(): boolean {
    if (enrollmentType === "new") {
      if (newStudentAnswered(newForm.getValues("is_new_student"))) return true
      newForm.setError("is_new_student", { type: "manual", message: PROFILE_REQUIRED_MESSAGE })
      return false
    }
    if (newStudentAnswered(reForm.getValues("is_new_student"))) return true
    reForm.setError("is_new_student", { type: "manual", message: PROFILE_REQUIRED_MESSAGE })
    return false
  }
}
