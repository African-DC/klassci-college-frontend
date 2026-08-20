import { z } from "zod"

// Miroir de app/schemas/fee.py (backend)

// Categorie de frais (ex: Scolarite, Inscription, Cantine, Transport)
// is_mandatory=true  → frais obligatoires, montants via FeeVariant (par level+series)
// is_mandatory=false → frais optionnels, options nommees via OptionalFeeOption
export const FeeCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  is_mandatory: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

// Variante de frais OBLIGATOIRE — montant par level + series + annee
export const FeeVariantSchema = z.object({
  id: z.number(),
  fee_category_id: z.number(),
  level_id: z.number(),
  series_id: z.number().nullable(),
  /**
   * `null` = ce montant s'applique à tout le monde. Sinon il ne vaut que
   * pour les élèves affectés, ou que pour les non affectés. En Côte d'Ivoire
   * un affecté est subventionné par l'État : il paie sensiblement moins.
   */
  assignment_scope: z.enum(["affecte", "non_affecte"]).nullish(),
  academic_year_id: z.number(),
  amount: z.coerce.number(),
  description: z.string().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export const FeeCategoryCreateSchema = z.object({
  name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  description: z.string().nullable().optional(),
  is_mandatory: z.boolean().default(true),
  /** Ordre d'imputation des versements : plus petit = servi en premier. */
  priority: z.number().int().min(0).max(999).optional(),
})

export const FeeVariantCreateSchema = z.object({
  fee_category_id: z.number({ required_error: "La catégorie est requise" }).positive(),
  level_id: z.number({ required_error: "Le niveau est requis" }).positive(),
  series_id: z.number().positive().nullable().optional(),
  assignment_scope: z.enum(["affecte", "non_affecte"]).nullable().optional(),
  amount: z.number({ required_error: "Le montant est requis" }).positive("Le montant doit être positif"),
  academic_year_id: z.number({ required_error: "L'année académique est requise" }).positive(),
  description: z.string().nullable().optional(),
})

export const FeeCategoryUpdateSchema = FeeCategoryCreateSchema.partial()
export const FeeVariantUpdateSchema = FeeVariantCreateSchema.partial()

// Option de frais OPTIONNEL — option nommee pour une categorie optionnelle
export const OptionalFeeOptionSchema = z.object({
  id: z.number(),
  fee_category_id: z.number(),
  academic_year_id: z.number(),
  name: z.string(),
  amount: z.coerce.number(),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const OptionalFeeOptionCreateSchema = z.object({
  fee_category_id: z.number({ required_error: "La catégorie est requise" }).positive(),
  academic_year_id: z.number({ required_error: "L'année académique est requise" }).positive(),
  name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  amount: z.number({ required_error: "Le montant est requis" }).positive("Le montant doit être positif"),
  description: z.string().nullable().optional(),
})

export const OptionalFeeOptionUpdateSchema = OptionalFeeOptionCreateSchema.partial()

// Schema formulaire UI (subset sans category_id/academic_year_id, injectés par le composant)
export const OptionalFeeOptionFormSchema = z.object({
  name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  amount: z.number({ required_error: "Le montant est requis" }).positive("Le montant doit être positif"),
  description: z.string().nullable().optional(),
})

export type FeeCategory = z.infer<typeof FeeCategorySchema>
export type FeeVariant = z.infer<typeof FeeVariantSchema>
export type OptionalFeeOption = z.infer<typeof OptionalFeeOptionSchema>
export type FeeCategoryCreate = z.infer<typeof FeeCategoryCreateSchema>
export type FeeCategoryUpdate = z.infer<typeof FeeCategoryUpdateSchema>
export type FeeVariantCreate = z.infer<typeof FeeVariantCreateSchema>
export type FeeVariantUpdate = z.infer<typeof FeeVariantUpdateSchema>
export type OptionalFeeOptionCreate = z.infer<typeof OptionalFeeOptionCreateSchema>
export type OptionalFeeOptionUpdate = z.infer<typeof OptionalFeeOptionUpdateSchema>

/** Niveaux du systeme scolaire ivoirien (college) */
export const LEVELS = ["6eme", "5eme", "4eme", "3eme"] as const


export type AssignmentScope = "affecte" | "non_affecte" | null

/** Portées d'affectation d'un montant, dans l'ordre d'affichage. */
export const ASSIGNMENT_SCOPES: {
  value: AssignmentScope
  label: string
  hint: string
}[] = [
  {
    value: null,
    label: "Tous les élèves",
    hint: "S'applique aussi bien aux affectés qu'aux non affectés",
  },
  {
    value: "affecte",
    label: "Élèves affectés",
    hint: "Subventionnés par l'État — les réaffectés sont inclus",
  },
  {
    value: "non_affecte",
    label: "Élèves non affectés",
    hint: "La famille prend la scolarité entièrement à sa charge",
  },
]

export function assignmentScopeLabel(scope: string | null | undefined): string {
  return ASSIGNMENT_SCOPES.find((s) => s.value === (scope ?? null))?.label ?? "Tous les élèves"
}
