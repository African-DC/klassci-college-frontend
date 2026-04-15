import { z } from "zod"

export const ParentSchema = z.object({
  id: z.number(),
  user_id: z.number().nullable(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).passthrough()

export const ParentCreateSchema = z.object({
  first_name: z.string({ required_error: "Le prénom est requis" }).min(1),
  last_name: z.string({ required_error: "Le nom est requis" }).min(1),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional(),
  password: z.string().min(8, "8 caractères minimum").optional(),
  relationship_type: z.enum(["father", "mother", "guardian", "other"]).default("guardian"),
})

export const ParentUpdateSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
})

export type Parent = z.infer<typeof ParentSchema>
export type ParentCreate = z.infer<typeof ParentCreateSchema>
export type ParentUpdate = z.infer<typeof ParentUpdateSchema>
