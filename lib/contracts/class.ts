import { z } from "zod"

export const ClassSchema = z.object({
  id: z.number(),
  name: z.string(),
  level_id: z.number(),
  series_id: z.number().nullable(),
  academic_year_id: z.number(),
  room_id: z.number().nullable(),
  max_students: z.number().nullish(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).passthrough()

export const ClassCreateSchema = z.object({
  name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  level_id: z.number({ required_error: "Le niveau est requis" }).positive("Le niveau est requis"),
  series_id: z.number().nullable().optional(),
  academic_year_id: z.number().positive().optional(),
  room_id: z.number().nullable().optional(),
  max_students: z.number().positive("La capacité doit être positive").optional(),
})

export const ClassUpdateSchema = ClassCreateSchema.partial()

export const ClassListParamsSchema = z.object({
  page: z.number().optional(),
  size: z.number().optional(),
  search: z.string().optional(),
  level_id: z.number().optional(),
})

export type Class = z.infer<typeof ClassSchema>
export type ClassCreate = z.infer<typeof ClassCreateSchema>
export type ClassUpdate = z.infer<typeof ClassUpdateSchema>
export type ClassListParams = z.infer<typeof ClassListParamsSchema>
