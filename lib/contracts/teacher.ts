import { z } from "zod"

export const TeacherSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().nullish(),
  phone: z.string().nullish(),
  subject_ids: z.array(z.number()).optional(),
  subject_names: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export const TeacherCreateSchema = z.object({
  first_name: z.string({ required_error: "Le prenom est requis" }).min(1, "Le prenom est requis"),
  last_name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  subject_ids: z.array(z.number()).optional(),
  is_active: z.boolean().default(true),
})

export const TeacherUpdateSchema = TeacherCreateSchema.partial()

export const TeacherListParamsSchema = z.object({
  page: z.number().optional(),
  per_page: z.number().optional(),
  search: z.string().optional(),
  is_active: z.boolean().optional(),
})

export type Teacher = z.infer<typeof TeacherSchema>
export type TeacherCreate = z.infer<typeof TeacherCreateSchema>
export type TeacherUpdate = z.infer<typeof TeacherUpdateSchema>
export type TeacherListParams = z.infer<typeof TeacherListParamsSchema>
