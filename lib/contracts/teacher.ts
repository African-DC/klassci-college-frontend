import { z } from "zod"

export const TeacherSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  speciality: z.string().nullable(),
  phone: z.string().nullish(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).passthrough()

export const TeacherCreateSchema = z.object({
  first_name: z.string({ required_error: "Le prénom est requis" }).min(1, "Le prénom est requis"),
  last_name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  speciality: z.string().optional(),
  phone: z.string().optional(),
})

export const TeacherUpdateSchema = TeacherCreateSchema.partial()

export const TeacherListParamsSchema = z.object({
  page: z.number().optional(),
  size: z.number().optional(),
  search: z.string().optional(),
})

export type Teacher = z.infer<typeof TeacherSchema>
export type TeacherCreate = z.infer<typeof TeacherCreateSchema>
export type TeacherUpdate = z.infer<typeof TeacherUpdateSchema>
export type TeacherListParams = z.infer<typeof TeacherListParamsSchema>
