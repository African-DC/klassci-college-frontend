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
  {
    value: "non_affecte" as const,
    label: "Non affecté",
    hint: "Scolarité à la charge de la famille",
  },
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

export const EnrollmentStatusSchema = z.enum([
  "prospect",
  "en_validation",
  "valide",
  "rejete",
  "annule",
])

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
  academic_year_id: z
    .number({ required_error: "L'année académique est requise" })
    .positive("L'année académique est requise"),
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
  /**
   * Absent = inchangé, `null` = remis à « non tranché ».
   *
   * Le profil se corrige après coup, comme la classe : une inscription saisie
   * avant que l'école ne connaisse la réponse ne doit pas rester fausse. Le
   * serveur régénère alors les frais, l'écran le dit avant de valider.
   */
  is_new_student: z.boolean().nullable().optional(),
  notes: z.string().optional().nullable(),
})

export const EnrollmentListParamsSchema = z.object({
  page: z.number().optional(),
  size: z.number().optional(),
  class_id: z.number().optional(),
  status: z.string().optional(),
  academic_year_id: z.number().optional(),
  search: z.string().optional(),
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
  /**
   * Reste dû sur les exercices AUTRES que celui de l'inscription en cours.
   *
   * `null` ne veut pas dire zéro : il veut dire « ce lecteur n'a pas le droit
   * de lire les montants ». Le serveur a déjà tranché selon `payments:read` ;
   * l'écran affiche un tiret et n'en déduit rien de plus. Un zéro à la place
   * dirait « cette famille ne doit rien ailleurs », ce qui est un mensonge.
   *
   * Repli à `null` : un serveur qui n'envoie pas encore le champ masque, il ne
   * publie pas — et surtout, la réponse entière continue de passer.
   */
  fees_arrears_other_years: z.coerce.number().nullish().default(null),
  /**
   * L'alerte seule, sans somme : ce que voit `payments:status:read`. `null`
   * quand le lecteur n'a droit ni aux montants ni à l'état.
   */
  has_arrears_other_years: z.boolean().nullish().default(null),
})

export type NewStudentSuggestion = z.infer<typeof NewStudentSuggestionSchema>

// ---------------------------------------------------------------------------
// Le refus : réinscription bloquée par une dette d'un exercice précédent
// ---------------------------------------------------------------------------

/** Code que le backend pose dans le `detail` de son 402. */
export const ENROLLMENT_BLOCKED_CODE = "ENROLLMENT_BLOCKED_BY_ARREARS"

export interface EnrollmentBlockedDetail {
  code: typeof ENROLLMENT_BLOCKED_CODE
  /** Phrase composée par le serveur. Elle porte le chiffre quand il est lisible. */
  message: string
  /** `null` quand le lecteur n'a pas le droit de lire les montants. Jamais `0`. */
  arrears_amount: number | null
  /** `null` quand il n'a droit ni aux montants ni à l'état. */
  has_arrears: boolean | null
  student_id: number | null
  academic_year_id: number | null
  /**
   * Vient de `enrollments:arrears:override`, résolu par le serveur. L'écran ne
   * propose la dérogation que si ce booléen est vrai : refaire le raisonnement
   * ici donnerait deux vérités, et la nôtre serait fausse le jour où une école
   * redistribue ce droit.
   */
  can_override: boolean
}

/**
 * Reconnaît le refus pour dette parmi les erreurs d'une création d'inscription.
 *
 * Même forme que `asDocumentBlocked` pour la retenue des documents : le client
 * HTTP ne connaît pas la sémantique des codes métier, chaque module lit le sien.
 *
 * Le montant n'est repris que s'il EST un nombre. `Number(null)` vaut `0`, et
 * un zéro se lirait « la famille ne doit rien » — exactement le mensonge que
 * ce refus existe pour ne plus dire.
 */
export function asEnrollmentBlocked(error: unknown): EnrollmentBlockedDetail | null {
  const detail = (error as { detail?: unknown } | null)?.detail
  if (detail === null || typeof detail !== "object") return null
  const candidate = detail as Record<string, unknown>
  if (candidate.code !== ENROLLMENT_BLOCKED_CODE) return null
  return {
    code: ENROLLMENT_BLOCKED_CODE,
    message:
      typeof candidate.message === "string" && candidate.message
        ? candidate.message
        : "Réinscription bloquée : un exercice précédent n'est pas soldé.",
    arrears_amount: numberOrNull(candidate.arrears_amount),
    has_arrears: typeof candidate.has_arrears === "boolean" ? candidate.has_arrears : null,
    student_id: numberOrNull(candidate.student_id),
    academic_year_id: numberOrNull(candidate.academic_year_id),
    can_override: candidate.can_override === true,
  }
}

/** Un nombre lisible, ou `null`. Ne fabrique jamais un `0` à partir d'un vide. */
function numberOrNull(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

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
