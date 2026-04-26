import { z } from "zod"

export const StudentSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  birth_date: z.string().nullish(),
  genre: z.enum(["M", "F"]).nullish(),
  enrollment_number: z.string().nullish(),
  city: z.string().nullish(),
  commune: z.string().nullish(),
  photo_url: z.string().nullable().optional(),
  user_id: z.number().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).passthrough()

export const StudentCreateSchema = z.object({
  first_name: z.string({ required_error: "Le prénom est requis" }).min(1, "Le prénom est requis"),
  last_name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  email: z.string({ required_error: "L'email est requis" }).email("Email invalide"),
  password: z.string({ required_error: "Le mot de passe est requis" }).min(8, "8 caractères minimum"),
  birth_date: z.string().optional(),
  genre: z.enum(["M", "F"]).optional(),
  enrollment_number: z.string().optional(),
  city: z.string().optional(),
  commune: z.string().optional(),
})

export const StudentUpdateSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  birth_date: z.string().optional(),
  genre: z.enum(["M", "F"]).optional(),
  enrollment_number: z.string().optional(),
  city: z.string().optional(),
  commune: z.string().optional(),
})

export const StudentListParamsSchema = z.object({
  page: z.number().optional(),
  size: z.number().optional(),
  search: z.string().optional(),
  genre: z.string().optional(),
})

export type Student = z.infer<typeof StudentSchema>
export type StudentCreate = z.infer<typeof StudentCreateSchema>
export type StudentUpdate = z.infer<typeof StudentUpdateSchema>
export type StudentListParams = z.infer<typeof StudentListParamsSchema>
