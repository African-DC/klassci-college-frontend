import { z } from "zod"

export const StaffSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  position: z.string().nullish(),
  phone: z.string().nullish(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).passthrough()

// Aligné sur TeacherCreate : un staff a aussi un compte user pour se
// connecter au portail (admin secondaire / secrétaire pédagogique).
// Le BE crée User + user_roles + StaffProfile en transaction.
export const StaffCreateSchema = z.object({
  first_name: z.string({ required_error: "Le prénom est requis" }).min(1, "Le prénom est requis"),
  last_name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  email: z.string({ required_error: "L'email est requis" }).email("Email invalide"),
  password: z.string({ required_error: "Le mot de passe est requis" }).min(8, "8 caractères minimum"),
  position: z.string().optional(),
  phone: z.string().optional(),
})

// L'update n'envoie jamais email/password (changement compte = endpoint dédié)
export const StaffUpdateSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
})

export const StaffListParamsSchema = z.object({
  page: z.number().optional(),
  size: z.number().optional(),
  search: z.string().optional(),
  position: z.string().optional(),
})

export type Staff = z.infer<typeof StaffSchema>
export type StaffCreate = z.infer<typeof StaffCreateSchema>
export type StaffUpdate = z.infer<typeof StaffUpdateSchema>
export type StaffListParams = z.infer<typeof StaffListParamsSchema>
