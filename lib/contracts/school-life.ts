import { z } from "zod"

// Miroir de app/schemas/school_life.py (backend). Les quatre actes de vie
// scolaire partagent ce fichier : ils décrivent le même domaine (ce que
// l'administration écrit à propos d'un élève en dehors des notes).

// ---------------------------------------------------------------------------
// Convocation de parent
// ---------------------------------------------------------------------------

export const SUMMONS_OUTCOME_OPTIONS = [
  { value: "pending", label: "Non renseignée" },
  { value: "attended", label: "Tuteur présent" },
  { value: "missed", label: "Tuteur absent" },
] as const

const SUMMONS_OUTCOME_LABELS: Record<string, string> = Object.fromEntries(
  SUMMONS_OUTCOME_OPTIONS.map((option) => [option.value, option.label]),
)

export function summonsOutcomeLabel(value?: string | null): string {
  if (!value) return "Non renseignée"
  return SUMMONS_OUTCOME_LABELS[value] ?? value
}

export const ParentSummonsSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  student_name: z.string(),
  enrollment_number: z.string().nullish(),
  class_name: z.string().nullish(),
  parent_id: z.number().nullish(),
  parent_name: z.string().nullish(),
  academic_year_id: z.number(),
  academic_year_name: z.string().nullish(),
  trimester: z.number(),
  summons_date: z.string(),
  summons_time: z.string(),
  reason: z.string(),
  reference: z.string().nullish(),
  outcome: z.string(),
  outcome_label: z.string(),
  outcome_notes: z.string().nullish(),
  outcome_recorded_at: z.string().nullish(),
  issued_by_user_id: z.number(),
  issued_by_name: z.string().nullish(),
  created_at: z.string(),
})

export const SummonsRegisterSummarySchema = z.object({
  total: z.number(),
  attended: z.number(),
  missed: z.number(),
  pending: z.number(),
})

// `summary` décrit tout le registre consulté (année, trimestre, élève), jamais
// la page rendue ni la suite filtrée : les quatre compteurs sont un tableau de
// bord d'établissement, pas un écho du filtre en cours.
export const ParentSummonsRegisterSchema = z.object({
  items: z.array(ParentSummonsSchema),
  summary: SummonsRegisterSummarySchema,
  total: z.number(),
  page: z.number(),
  size: z.number(),
})

// Le backend exige un tuteur : sa fiche quand elle existe, sinon le nom dicté
// au guichet. Le refus est plus clair côté formulaire qu'en 422.
export const ParentSummonsCreateSchema = z
  .object({
    student_id: z.number({ required_error: "L'élève est requis" }).positive("L'élève est requis"),
    parent_id: z.number().positive().nullish(),
    parent_name: z.string().max(200).optional(),
    summons_date: z
      .string({ required_error: "La date est requise" })
      .min(1, "La date est requise"),
    summons_time: z
      .string({ required_error: "L'heure est requise" })
      .min(1, "L'heure est requise"),
    reason: z
      .string({ required_error: "Le motif est requis" })
      .min(3, "Le motif doit faire au moins 3 caractères")
      .max(2000, "Le motif est trop long"),
    trimester: z.number().int().min(1).max(3).nullish(),
  })
  .refine((data) => data.parent_id != null || (data.parent_name ?? "").trim().length > 0, {
    message: "Indiquez le tuteur convoqué : une fiche parent ou un nom",
    path: ["parent_name"],
  })

export const SummonsOutcomeUpdateSchema = z.object({
  outcome: z.enum(["pending", "attended", "missed"], {
    required_error: "La suite donnée est requise",
  }),
  notes: z.string().max(2000, "La note est trop longue").optional(),
})

// ---------------------------------------------------------------------------
// Autorisation de rattrapage (billet d'annulation de zéro)
// ---------------------------------------------------------------------------

export const RetakeTargetSchema = z.object({
  evaluation_id: z.number(),
  title: z.string(),
  subject_name: z.string().nullish(),
  date: z.string(),
  coefficient: z.number(),
  trimester: z.number(),
})

export const RetakeAuthorizationSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  student_name: z.string(),
  enrollment_number: z.string().nullish(),
  class_name: z.string().nullish(),
  academic_year_id: z.number(),
  academic_year_name: z.string().nullish(),
  trimester: z.number(),
  period_start: z.string(),
  period_end: z.string(),
  reason: z.string(),
  reference: z.string().nullish(),
  issued_by_user_id: z.number(),
  issued_by_name: z.string().nullish(),
  evaluations: z.array(RetakeTargetSchema),
  created_at: z.string(),
})

// `total` et `reopened_evaluations` portent sur toute la période consultée, pas
// sur la page rendue : les compter à l'écran les ferait varier avec la
// pagination.
export const RetakeAuthorizationListSchema = z.object({
  items: z.array(RetakeAuthorizationSchema),
  total: z.number(),
  reopened_evaluations: z.number(),
  page: z.number(),
  size: z.number(),
})

export const RetakeAuthorizationCreateSchema = z
  .object({
    student_id: z.number({ required_error: "L'élève est requis" }).positive("L'élève est requis"),
    period_start: z
      .string({ required_error: "Le début de la période est requis" })
      .min(1, "Le début de la période est requis"),
    period_end: z
      .string({ required_error: "La fin de la période est requise" })
      .min(1, "La fin de la période est requise"),
    reason: z
      .string({ required_error: "Le motif est requis" })
      .min(3, "Le motif doit faire au moins 3 caractères")
      .max(2000, "Le motif est trop long"),
    evaluation_ids: z
      .array(z.number().positive())
      .min(1, "Sélectionnez au moins une évaluation manquée"),
  })
  .refine((data) => data.period_end >= data.period_start, {
    message: "La fin de la période doit suivre son début",
    path: ["period_end"],
  })

// ---------------------------------------------------------------------------
// Billet d'entrée
// ---------------------------------------------------------------------------

export const EntrySlipRequestSchema = z.object({
  resume_date: z.string().min(1, "La date de reprise est requise"),
  notes: z.string().max(500, "Le motif est trop long").optional(),
})

export type ParentSummons = z.infer<typeof ParentSummonsSchema>
export type SummonsRegisterSummary = z.infer<typeof SummonsRegisterSummarySchema>
export type ParentSummonsRegister = z.infer<typeof ParentSummonsRegisterSchema>
export type ParentSummonsCreate = z.infer<typeof ParentSummonsCreateSchema>
export type SummonsOutcomeUpdate = z.infer<typeof SummonsOutcomeUpdateSchema>
export type RetakeTarget = z.infer<typeof RetakeTargetSchema>
export type RetakeAuthorization = z.infer<typeof RetakeAuthorizationSchema>
export type RetakeAuthorizationList = z.infer<typeof RetakeAuthorizationListSchema>
export type RetakeAuthorizationCreate = z.infer<typeof RetakeAuthorizationCreateSchema>
export type EntrySlipRequest = z.infer<typeof EntrySlipRequestSchema>
