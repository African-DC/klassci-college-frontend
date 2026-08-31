import type { UseFormReturn } from "react-hook-form"
import { Check, GraduationCap, UserPlus } from "lucide-react"
import type { NewEnrollment, ReEnrollment } from "@/lib/contracts/enrollment"

export type EnrollmentType = "new" | "re-enrollment"

export const ENROLLMENT_STEPS = [
  { id: "type", label: "Type", icon: GraduationCap },
  { id: "student", label: "Élève", icon: UserPlus },
  { id: "class", label: "Classe", icon: GraduationCap },
  { id: "summary", label: "Résumé", icon: Check },
] as const

/**
 * `is_new_student` reste absent des valeurs par défaut, sciemment.
 *
 * `undefined` veut dire « personne n'a encore répondu », et laisse la
 * suggestion du serveur pré-remplir. `null` veut dire « on a répondu qu'on ne
 * peut pas trancher », ce qui est une réponse à part entière : l'inscription ne
 * recevra alors aucun tarif réservé aux nouveaux ni aux anciens.
 */
export const NEW_ENROLLMENT_DEFAULTS: Partial<NewEnrollment> = {
  type: "new",
  first_name: "",
  last_name: "",
  birth_date: null,
  birth_place: null,
  genre: null,
  enrollment_number: null,
  city: null,
  commune: null,
  parent: null,
  class_id: undefined,
  assignment_status: null,
  assignment_decision_number: null,
  is_new_student: undefined,
  fee_variant_id: null,
  notes: null,
}

export const RE_ENROLLMENT_DEFAULTS: Partial<ReEnrollment> = {
  type: "re-enrollment",
  student_id: undefined,
  class_id: undefined,
  assignment_status: null,
  assignment_decision_number: null,
  is_new_student: undefined,
  fee_variant_id: null,
  notes: null,
}

export function inKindDepositsPayload(deposits: Record<number, boolean>) {
  return Object.entries(deposits).map(([id, deposited]) => ({
    fee_category_id: Number(id),
    deposited,
  }))
}

/**
 * Ce qu'il faut avoir renseigné pour passer à l'étape suivante.
 *
 * On valide le strict nécessaire de l'étape courante : bloquer sur un champ
 * que l'écran n'affiche pas encore laisserait la secrétaire devant un bouton
 * « Suivant » muet, sans savoir ce qui manque.
 */
export async function validateEnrollmentStep(
  step: number,
  enrollmentType: EnrollmentType | null,
  newForm: UseFormReturn<NewEnrollment>,
  reForm: UseFormReturn<ReEnrollment>,
  showParentFields: boolean,
): Promise<boolean> {
  if (step === 0) return !!enrollmentType

  if (step === 1) {
    if (enrollmentType !== "new") return reForm.trigger(["student_id"])
    const valid = await newForm.trigger([
      "first_name",
      "last_name",
      "birth_date",
      "birth_place",
      "genre",
      "enrollment_number",
    ])
    if (!valid) return false
    if (!showParentFields) return true
    return newForm.trigger([
      "parent.first_name",
      "parent.last_name",
      "parent.phone",
      "parent.email",
      "parent.relationship_type",
    ])
  }

  if (step === 2) {
    return enrollmentType === "new" ? newForm.trigger(["class_id"]) : reForm.trigger(["class_id"])
  }

  return true
}
