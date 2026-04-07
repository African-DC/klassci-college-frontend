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

export const StaffCreateSchema = z.object({
  first_name: z.string({ required_error: "Le prénom est requis" }).min(1, "Le prénom est requis"),
  last_name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  position: z.string().optional(),
  phone: z.string().optional(),
})

export const StaffUpdateSchema = StaffCreateSchema.partial()

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
