import { z } from "zod"

/** Type d'acteur dont on gère le compte de connexion. */
export const AccountEntityTypeSchema = z.enum(["student", "parent", "teacher", "staff"])
export type AccountEntityType = z.infer<typeof AccountEntityTypeSchema>

export const AccountStatusSchema = z.object({
  entity_type: AccountEntityTypeSchema,
  entity_id: z.number(),
  full_name: z.string(),
  has_account: z.boolean(),
  can_create: z.boolean(),
  user_id: z.number().nullish(),
  email: z.string().nullish(),
  is_active: z.boolean(),
  last_login: z.string().nullish(),
  must_change_password: z.boolean(),
  suggested_email: z.string().nullish(),
})
export type AccountStatus = z.infer<typeof AccountStatusSchema>

export const AccountActionSchema = z.object({
  user_id: z.number(),
  email: z.string(),
  temporary_password: z.string(),
  must_change_password: z.boolean(),
})
export type AccountAction = z.infer<typeof AccountActionSchema>

export const AccountCreateSchema = z.object({
  email: z.string().email("Email invalide"),
})
export type AccountCreateInput = z.infer<typeof AccountCreateSchema>

export const ChangePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Mot de passe actuel requis"),
    new_password: z.string().min(8, "8 caractères minimum"),
    confirm_password: z.string().min(1, "Confirmation requise"),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm_password"],
  })
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>
