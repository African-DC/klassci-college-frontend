import { z } from "zod"

// Miroir de app/schemas/enrollment.py (backend)

/**
 * Affectation par l'État. Un élève affecté dans un établissement privé est
 * subventionné : sa famille paie sensiblement moins. Le réaffecté — réorienté
 * vers un autre établissement — reste pris en charge, donc payé comme un
 * affecté ; on garde la distinction parce que les dossiers du ministère et le
 * rapport de fin de trimestre la réclament.
 */
export const AssignmentStatusSchema = z.enum(["affecte", "reaffecte", "non_affecte"])

export const ASSIGNMENT_STATUSES = [
  { value: "affecte" as const, label: "Affecté", hint: "Subventionné par l'État" },
  { value: "reaffecte" as const, label: "Réaffecté", hint: "Réorienté, subventionné également" },
  { value: "non_affecte" as const, label: "Non affecté", hint: "Scolarité à la charge de la famille" },
]

export function assignmentStatusLabel(status: string | null | undefined): string {
  if (!status) return "Non renseigné"
  return ASSIGNMENT_STATUSES.find((s) => s.value === status)?.label ?? status
}

/**
 * Le profil d'inscription : l'élève arrive cette année, ou il était déjà là.
 *
 * `null` ne veut pas dire « non » : il veut dire « personne n'a tranché ». Une
 * inscription restée à `null` ne reçoit aucun tarif réservé aux nouveaux ni aux
 * anciens, exactement comme une affectation non renseignée n'ouvre aucun tarif
 * d'affecté. Un établissement dont l'année précédente n'est pas reconstituée en
 * base n'a aucun moyen de savoir : déduire « aucune inscription antérieure donc
 * nouveau » facturerait la chemise cartonnée à tous ses anciens élèves, qui la
 * découvriraient sur leur facture.
 */
export function newStudentLabel(value: boolean | null | undefined): string {
  if (value === true) return "Nouvel élève"
  if (value === false) return "Ancien élève"
  return "Non tranché"
}

export const EnrollmentStatusSchema = z.enum(["prospect", "en_validation", "valide", "rejete", "annule"])

export const EnrollmentSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  class_id: z.number(),
  academic_year_id: z.number(),
  academic_year_name: z.string(),
  status: EnrollmentStatusSchema,
  /** `null` tant que l'école ne l'a pas renseigné : on ne devine pas. */
  assignment_status: AssignmentStatusSchema.nullish(),
  assignment_decision_number: z.string().nullish(),
  /** `null` = personne n'a tranché. Voir `newStudentLabel`. */
  is_new_student: z.boolean().nullish(),
  fee_variant_id: z.number().nullable(),
  notes: z.string().nullable(),
  created_by: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  student_first_name: z.string().nullable().optional(),
  student_last_name: z.string().nullable().optional(),
  class_name: z.string().nullable().optional(),
})

export const EnrollmentCreateSchema = z.object({
  student_id: z.number({ required_error: "L'élève est requis" }).positive("L'élève est requis"),
  class_id: z.number({ required_error: "La classe est requise" }).positive("La classe est requise"),
  assignment_status: AssignmentStatusSchema.nullable().optional(),
  assignment_decision_number: z.string().nullable().optional(),
  /** Absent = le serveur déduit. Envoyé à `null` = l'école laisse en suspens. */
  is_new_student: z.boolean().nullable().optional(),
  academic_year_id: z.number({ required_error: "L'année académique est requise" }).positive("L'année académique est requise"),
  fee_variant_id: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  in_kind_deposits: z
    .array(z.object({ fee_category_id: z.number(), deposited: z.boolean() }))
    .optional(),
})

export const EnrollmentUpdateSchema = z.object({
  class_id: z.number().positive().optional(),
  assignment_status: AssignmentStatusSchema.nullable().optional(),
  assignment_decision_number: z.string().nullable().optional(),
  status: EnrollmentStatusSchema.optional(),
  notes: z.string().optional().nullable(),
})

export const EnrollmentListParamsSchema = z.object({
  page: z.number().optional(),
  size: z.number().optional(),
  class_id: z.number().optional(),
  status: z.string().optional(),
  academic_year_id: z.number().optional(),
})

export type EnrollmentStatus = z.infer<typeof EnrollmentStatusSchema>
export type Enrollment = z.infer<typeof EnrollmentSchema>
export type EnrollmentCreate = z.infer<typeof EnrollmentCreateSchema>
export type EnrollmentUpdate = z.infer<typeof EnrollmentUpdateSchema>
export type EnrollmentListParams = z.infer<typeof EnrollmentListParamsSchema>

// --- Multi-step enrollment form schemas ---

export const ParentInputSchema = z.object({
  first_name: z.string().min(1, "Le prénom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  phone: z.string().nullable().optional(),
  email: z.string().email("Email invalide").nullable().optional(),
  password: z.string().min(8, "8 caractères minimum").nullable().optional(),
  relationship_type: z.enum(["father", "mother", "guardian", "other"]).default("guardian"),
  city: z.string().nullable().optional(),
  commune: z.string().nullable().optional(),
})

export const NewEnrollmentSchema = z.object({
  type: z.literal("new"),
  // Student info
  first_name: z.string().min(1, "Le prenom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  birth_date: z.string().nullable().optional(),
  birth_place: z.string().nullable().optional(),
  genre: z.enum(["M", "F"]).nullable().optional(),
  enrollment_number: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  commune: z.string().nullable().optional(),
  // Parent info (optional)
  parent: ParentInputSchema.nullable().optional(),
  // Class
  class_id: z.number({ required_error: "La classe est requise" }).positive(),
  // Decide du tarif applique : saisi a la creation, pas apres coup.
  assignment_status: AssignmentStatusSchema.nullable().optional(),
  assignment_decision_number: z.string().nullable().optional(),
  /** Idem : certains frais ne sont dus que par les nouveaux, ou que par les anciens. */
  is_new_student: z.boolean().nullable().optional(),
  fee_variant_id: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
  in_kind_deposits: z
    .array(z.object({ fee_category_id: z.number(), deposited: z.boolean() }))
    .optional(),
})

export const ReEnrollmentSchema = z.object({
  type: z.literal("re-enrollment"),
  student_id: z.number({ required_error: "L'eleve est requis" }).positive(),
  class_id: z.number({ required_error: "La classe est requise" }).positive(),
  // Decide du tarif applique : saisi a la creation, pas apres coup.
  assignment_status: AssignmentStatusSchema.nullable().optional(),
  assignment_decision_number: z.string().nullable().optional(),
  /** Idem : certains frais ne sont dus que par les nouveaux, ou que par les anciens. */
  is_new_student: z.boolean().nullable().optional(),
  fee_variant_id: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
  in_kind_deposits: z
    .array(z.object({ fee_category_id: z.number(), deposited: z.boolean() }))
    .optional(),
})

export const FeeVariantOptionSchema = z.object({
  id: z.number(),
  fee_category_id: z.number(),
  category_name: z.string().optional(),
  // Absent vaut obligatoire, et les écrans lisent tous `!== false` : la valeur
  // par défaut de Zod donnait au type de sortie une garantie que le type
  // d'entrée n'avait pas, et la validation ne pouvait plus être typée.
  is_mandatory: z.boolean().optional(),
  accepts_in_kind: z.boolean().optional(),
  amount: z.coerce.number(),
  description: z.string().nullable(),
})

export type ParentInput = z.infer<typeof ParentInputSchema>
export type NewEnrollment = z.infer<typeof NewEnrollmentSchema>
export type ReEnrollment = z.infer<typeof ReEnrollmentSchema>
export type FeeVariantOption = z.infer<typeof FeeVariantOptionSchema>

/** Ce que rend une validation en lot. */
export const BulkValidateResultSchema = z.object({
  validated: z.array(z.number()),
  // Chaque refus avec son motif : sans lui, l'ecran ne peut que dire
  // « certaines ont echoue », ce qui oblige a rouvrir chaque dossier.
  failed: z.array(z.object({ enrollment_id: z.number(), reason: z.string() })),
})

export type BulkValidateResult = z.infer<typeof BulkValidateResultSchema>

// ---------------------------------------------------------------------------
// Le profil d'inscription : suggestion serveur et régénération des frais
// ---------------------------------------------------------------------------

/**
 * Ce que le serveur sait dire du profil d'un élève, et rien de plus.
 *
 * `suggested` vaut `null` quand l'établissement n'a aucune année antérieure en
 * base : le serveur refuse alors d'affirmer, et `reason` explique pourquoi à la
 * secrétaire, en français, pour qu'elle tranche elle-même. C'est le cas d'une
 * école dont l'année précédente n'a jamais été saisie.
 */
export const NewStudentSuggestionSchema = z.object({
  suggested: z.boolean().nullable(),
  reason: z.string(),
})

export type NewStudentSuggestion = z.infer<typeof NewStudentSuggestionSchema>

/**
 * Ce que rend une régénération des frais d'une inscription.
 *
 * `message` est écrit par le serveur et s'affiche tel quel : lui seul sait
 * combien de lignes il a réellement remplacées et combien il a laissées en
 * place parce qu'un versement y était imputé. Les compteurs sont facultatifs
 * pour que l'écran continue de fonctionner si le serveur ne les renvoie pas
 * encore, auquel cas la phrase du serveur suffit.
 */
export const FeeRegenerationResultSchema = z.object({
  fees_created: z.number().nullish(),
  fees_replaced: z.number().nullish(),
  fees_kept_with_payments: z.number().nullish(),
  message: z.string().nullish(),
})

export type FeeRegenerationResult = z.infer<typeof FeeRegenerationResultSchema>
