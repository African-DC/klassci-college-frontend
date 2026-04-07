import { z } from "zod"

export const StudentSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  matricule: z.string().nullish(),
  date_of_birth: z.string().nullish(),
  gender: z.enum(["M", "F"]).nullish(),
  class_id: z.number().nullish(),
  class_name: z.string().nullish(),
  parent_phone: z.string().nullish(),
  address: z.string().nullish(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export const StudentCreateSchema = z.object({
  first_name: z.string({ required_error: "Le prénom est requis" }).min(1, "Le prénom est requis"),
  last_name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  matricule: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(["M", "F"]).optional(),
  class_id: z.number().positive().optional(),
  parent_phone: z.string().optional(),
  address: z.string().optional(),
})

export const StudentUpdateSchema = StudentCreateSchema.partial()

export const StudentListParamsSchema = z.object({
  page: z.number().optional(),
  size: z.number().optional(),
  search: z.string().optional(),
  class_id: z.number().optional(),
  gender: z.string().optional(),
})

export type Student = z.infer<typeof StudentSchema>
export type StudentCreate = z.infer<typeof StudentCreateSchema>
export type StudentUpdate = z.infer<typeof StudentUpdateSchema>
export type StudentListParams = z.infer<typeof StudentListParamsSchema>
