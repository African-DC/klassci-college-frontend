import { z } from "zod"

// Miroir de app/schemas/auth.py (backend)

export const UserRoleSchema = z.enum(["admin", "teacher", "student", "parent"])

export const LoginRequestSchema = z.object({
  email: z
    .string({ required_error: "L'email est requis" })
    .email("Email invalide"),
  password: z
    .string({ required_error: "Le mot de passe est requis" })
    .min(1, "Le mot de passe est requis"),
})

export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  role: UserRoleSchema,
  first_name: z.string(),
  last_name: z.string(),
})

export const LoginResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
  user: UserSchema,
})

export const RefreshResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
})

export type UserRole = z.infer<typeof UserRoleSchema>
export type LoginRequest = z.infer<typeof LoginRequestSchema>
export type User = z.infer<typeof UserSchema>
export type LoginResponse = z.infer<typeof LoginResponseSchema>
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>
