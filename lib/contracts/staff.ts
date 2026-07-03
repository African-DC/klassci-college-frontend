import { z } from "zod"

// Rôles d'accès assignables à un membre du personnel (miroir de
// STAFF_ASSIGNABLE_ROLES côté backend). Jamais admin / super_admin.
export const STAFF_ROLE_OPTIONS = [
  { value: "staff", label: "Personnel" },
  { value: "accountant", label: "Comptable" },
  { value: "director", label: "Directeur" },
] as const

const STAFF_ROLE_LABELS: Record<string, string> = {
  staff: "Personnel",
  accountant: "Comptable",
  director: "Directeur",
}

/** Libellé français du rôle d'accès (défaut : Personnel). */
export function staffRoleLabel(role?: string | null): string {
  if (!role) return "Personnel"
  return STAFF_ROLE_LABELS[role] ?? role
}

export const StaffSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  position: z.string().nullish(),
  phone: z.string().nullish(),
  role: z.string().nullish(),
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
  role: z.string().optional(),
})

// L'update n'envoie jamais email/password (changement compte = endpoint dédié)
export const StaffUpdateSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
})

export const StaffListParamsSchema = z.object({
  page: z.number().optional(),
  size: z.number().optional(),
  search: z.string().optional(),
  position: z.string().optional(),
})

export const StaffActivitySchema = z.object({
  payments_count: z.number(),
  payments_amount: z.coerce.number(),
  enrollments_count: z.number(),
  academic_year_name: z.string().nullish(),
})

export const StaffFullSchema = StaffSchema.extend({
  photo_url: z.string().nullish(),
  user_email: z.string().nullish(),
  user_is_active: z.boolean().nullish(),
  user_last_login: z.string().nullish(),
  user_created_at: z.string().nullish(),
  activity: StaffActivitySchema,
})

export type Staff = z.infer<typeof StaffSchema>
export type StaffCreate = z.infer<typeof StaffCreateSchema>
export type StaffUpdate = z.infer<typeof StaffUpdateSchema>
export type StaffListParams = z.infer<typeof StaffListParamsSchema>
export type StaffActivity = z.infer<typeof StaffActivitySchema>
export type StaffFull = z.infer<typeof StaffFullSchema>
