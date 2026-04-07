import { z } from "zod"

// Miroir de app/schemas/role.py (backend)
// Backend Permission: {id, slug, name, description}
// Backend Role: {id, name, description}

export const PermissionSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullish(),
})

export const RoleSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullish(),
  is_system: z.boolean().optional(),
  permissions: z.array(PermissionSchema).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export const RoleCreateSchema = z.object({
  name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  description: z.string().optional(),
  permission_ids: z.array(z.number()).optional(),
})

export const RoleUpdateSchema = RoleCreateSchema.partial()

export const RoleListParamsSchema = z.object({
  page: z.number().optional(),
  size: z.number().optional(),
  search: z.string().optional(),
})

export type Permission = z.infer<typeof PermissionSchema>
export type Role = z.infer<typeof RoleSchema>
export type RoleCreate = z.infer<typeof RoleCreateSchema>
export type RoleUpdate = z.infer<typeof RoleUpdateSchema>
export type RoleListParams = z.infer<typeof RoleListParamsSchema>
