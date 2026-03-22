import { z } from "zod"

export const SubjectSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  coefficient: z.number(),
  level: z.string().nullish(),
  category: z.string().nullish(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export const SubjectCreateSchema = z.object({
  name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  code: z.string({ required_error: "Le code est requis" }).min(1, "Le code est requis"),
  coefficient: z.number({ required_error: "Le coefficient est requis" }).positive("Le coefficient doit etre positif"),
  level: z.string().optional(),
  category: z.string().optional(),
})

export const SubjectUpdateSchema = SubjectCreateSchema.partial()

export const SubjectListParamsSchema = z.object({
  page: z.number().optional(),
  per_page: z.number().optional(),
  search: z.string().optional(),
  level: z.string().optional(),
})

export type Subject = z.infer<typeof SubjectSchema>
export type SubjectCreate = z.infer<typeof SubjectCreateSchema>
export type SubjectUpdate = z.infer<typeof SubjectUpdateSchema>
export type SubjectListParams = z.infer<typeof SubjectListParamsSchema>
