import { z } from "zod"

export const SubjectSchema = z.object({
  id: z.number(),
  name: z.string(),
  level_id: z.number().nullable(),
  series_id: z.number().nullable(),
  coefficient: z.number(),
  hours_per_week: z.number(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).passthrough()

export const SubjectCreateSchema = z.object({
  name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  coefficient: z.number({ required_error: "Le coefficient est requis" }).positive("Le coefficient doit être positif"),
  hours_per_week: z.number({ required_error: "Les heures par semaine sont requises" }).positive("Les heures doivent être positives"),
  level_id: z.number().nullable().optional(),
  series_id: z.number().nullable().optional(),
})

export const SubjectUpdateSchema = SubjectCreateSchema.partial()

export const SubjectListParamsSchema = z.object({
  page: z.number().optional(),
  size: z.number().optional(),
  search: z.string().optional(),
  level_id: z.number().optional(),
})

export type Subject = z.infer<typeof SubjectSchema>
export type SubjectCreate = z.infer<typeof SubjectCreateSchema>
export type SubjectUpdate = z.infer<typeof SubjectUpdateSchema>
export type SubjectListParams = z.infer<typeof SubjectListParamsSchema>
