import { z } from "zod"

// Miroir de app/schemas/fee.py (backend)

// Catégorie de frais (ex: Scolarité, Inscription, COGES, Cantine)
export const FeeCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

// Variante de frais — montant par catégorie et par niveau
export const FeeVariantSchema = z.object({
  id: z.number(),
  category_id: z.number(),
  category_name: z.string(),
  level: z.string(),
  amount: z.number(),
  academic_year_id: z.number(),
  academic_year_label: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const FeeCategoryCreateSchema = z.object({
  name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  description: z.string().nullable().optional(),
})

export const FeeVariantCreateSchema = z.object({
  category_id: z.number({ required_error: "La catégorie est requise" }).positive(),
  level: z.string({ required_error: "Le niveau est requis" }).min(1, "Le niveau est requis"),
  amount: z.number({ required_error: "Le montant est requis" }).positive("Le montant doit être positif"),
  academic_year_id: z.number({ required_error: "L'année académique est requise" }).positive(),
})

export const FeeCategoryUpdateSchema = FeeCategoryCreateSchema.partial()
export const FeeVariantUpdateSchema = FeeVariantCreateSchema.partial()

export type FeeCategory = z.infer<typeof FeeCategorySchema>
export type FeeVariant = z.infer<typeof FeeVariantSchema>
export type FeeCategoryCreate = z.infer<typeof FeeCategoryCreateSchema>
export type FeeCategoryUpdate = z.infer<typeof FeeCategoryUpdateSchema>
export type FeeVariantCreate = z.infer<typeof FeeVariantCreateSchema>
export type FeeVariantUpdate = z.infer<typeof FeeVariantUpdateSchema>

/** Niveaux du système scolaire ivoirien (collège) */
export const LEVELS = ["6ème", "5ème", "4ème", "3ème"] as const
