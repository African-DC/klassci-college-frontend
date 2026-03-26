import { z } from "zod"

export const StaffSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().nullish(),
  phone: z.string().nullish(),
  role: z.string().nullish(),
  department: z.string().nullish(),
  is_active: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export const StaffCreateSchema = z.object({
  first_name: z.string({ required_error: "Le prénom est requis" }).min(1, "Le prénom est requis"),
  last_name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.string().optional(),
  department: z.string().optional(),
  is_active: z.boolean().default(true),
})

export const StaffUpdateSchema = StaffCreateSchema.partial()

export const StaffListParamsSchema = z.object({
  page: z.number().optional(),
  per_page: z.number().optional(),
  search: z.string().optional(),
  role: z.string().optional(),
})

export type Staff = z.infer<typeof StaffSchema>
export type StaffCreate = z.infer<typeof StaffCreateSchema>
export type StaffUpdate = z.infer<typeof StaffUpdateSchema>
export type StaffListParams = z.infer<typeof StaffListParamsSchema>
