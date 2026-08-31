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
 * `is_new_student` part à `null`, jamais à `undefined`.
 *
 * `JSON.stringify` supprime les clés `undefined` : le champ disparaîtrait du
 * corps de la requête, et le serveur déduirait le profil alors que l'écran
 * promettait de ne rien affirmer. `null` traverse le réseau et dit ce qu'il
 * veut dire : personne n'a tranché, aucun tarif réservé aux nouveaux ni aux
 * anciens ne sera facturé.
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
  is_new_student: null,
  fee_variant_id: null,
  notes: null,
}

export const RE_ENROLLMENT_DEFAULTS: Partial<ReEnrollment> = {
  type: "re-enrollment",
  student_id: undefined,
  class_id: undefined,
  assignment_status: null,
  assignment_decision_number: null,
  is_new_student: null,
  fee_variant_id: null,
  notes: null,
}

/**
 * Ce que l'écran dit quand on tente de continuer sans avoir répondu.
 *
 * Le message nomme la conséquence, sinon la secrétaire lit « champ requis » et
 * cherche lequel : c'est une question dont la réponse change la facture.
 */
export const PROFILE_REQUIRED_MESSAGE =
  "Indiquez si l'élève arrive cette année ou s'il était déjà inscrit ici : certains frais ne sont dus que par les nouveaux, d'autres que par les anciens."

/** Répondu veut dire « oui » ou « non ». `null` et `undefined` ne répondent pas. */
export function newStudentAnswered(value: boolean | null | undefined): value is boolean {
  return value === true || value === false
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

  // L'étape Classe porte aussi le profil de l'inscription. Il est obligatoire :
  // tant que l'école n'a pas déclaré son historique exploitable, le serveur ne
  // suggère rien, et une valeur par défaut silencieuse facturerait de travers.
  if (step === 2) {
    return enrollmentType === "new" ? newForm.trigger(["class_id"]) : reForm.trigger(["class_id"])
  }

  return true
}
