import { z } from "zod"

export const ClassSchema = z.object({
  id: z.number(),
  name: z.string(),
  level: z.string(),
  section: z.string().nullish(),
  capacity: z.number().nullish(),
  academic_year_id: z.number().nullish(),
  academic_year_label: z.string().nullish(),
  teacher_id: z.number().nullish(),
  teacher_name: z.string().nullish(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export const ClassCreateSchema = z.object({
  name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  level: z.string({ required_error: "Le niveau est requis" }).min(1, "Le niveau est requis"),
  section: z.string().optional(),
  capacity: z.number().positive("La capacité doit être positive").optional(),
  academic_year_id: z.number().positive().optional(),
  teacher_id: z.number().positive().optional(),
})

export const ClassUpdateSchema = ClassCreateSchema.partial()

export const ClassListParamsSchema = z.object({
  page: z.number().optional(),
  per_page: z.number().optional(),
  search: z.string().optional(),
  level: z.string().optional(),
})

export type Class = z.infer<typeof ClassSchema>
export type ClassCreate = z.infer<typeof ClassCreateSchema>
export type ClassUpdate = z.infer<typeof ClassUpdateSchema>
export type ClassListParams = z.infer<typeof ClassListParamsSchema>
