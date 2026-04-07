import { z } from "zod"

// Miroir de app/schemas/fee.py (backend)

// Categorie de frais (ex: Scolarite, Inscription, COGES, Cantine)
export const FeeCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

// Variante de frais — montant par categorie et par classe
// Backend FeeVariant: id, fee_category_id, class_id, academic_year_id, amount, description
export const FeeVariantSchema = z.object({
  id: z.number(),
  fee_category_id: z.number(),
  class_id: z.number(),
  academic_year_id: z.number(),
  amount: z.coerce.number(),
  description: z.string().nullable(),
})

export const FeeCategoryCreateSchema = z.object({
  name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  description: z.string().nullable().optional(),
})

export const FeeVariantCreateSchema = z.object({
  fee_category_id: z.number({ required_error: "La catégorie est requise" }).positive(),
  class_id: z.number({ required_error: "La classe est requise" }).positive(),
  amount: z.number({ required_error: "Le montant est requis" }).positive("Le montant doit être positif"),
  academic_year_id: z.number({ required_error: "L'année académique est requise" }).positive(),
  description: z.string().nullable().optional(),
})

export const FeeCategoryUpdateSchema = FeeCategoryCreateSchema.partial()
export const FeeVariantUpdateSchema = FeeVariantCreateSchema.partial()

export type FeeCategory = z.infer<typeof FeeCategorySchema>
export type FeeVariant = z.infer<typeof FeeVariantSchema>
export type FeeCategoryCreate = z.infer<typeof FeeCategoryCreateSchema>
export type FeeCategoryUpdate = z.infer<typeof FeeCategoryUpdateSchema>
export type FeeVariantCreate = z.infer<typeof FeeVariantCreateSchema>
export type FeeVariantUpdate = z.infer<typeof FeeVariantUpdateSchema>

/** Niveaux du systeme scolaire ivoirien (college) */
export const LEVELS = ["6eme", "5eme", "4eme", "3eme"] as const
