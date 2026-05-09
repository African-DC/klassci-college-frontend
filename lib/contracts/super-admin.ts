import { z } from "zod"

export const tenantListItemSchema = z.object({
  slug: z.string(),
  url: z.string(),
  db_size_bytes: z.number(),
})
export type TenantListItem = z.infer<typeof tenantListItemSchema>

export const tenantListResponseSchema = z.object({
  items: z.array(tenantListItemSchema),
  total: z.number(),
})
export type TenantListResponse = z.infer<typeof tenantListResponseSchema>

export const tenantSchoolSettingsSchema = z.object({
  school_name: z.string().nullable(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  ministry_code: z.string().nullable(),
})

export const tenantCountsSchema = z.object({
  users: z.number(),
  students: z.number(),
  teachers: z.number(),
  staff: z.number(),
  enrollments: z.number(),
  payments: z.number(),
})
export type TenantCounts = z.infer<typeof tenantCountsSchema>

export const tenantDetailSchema = z.object({
  slug: z.string(),
  url: z.string(),
  school_settings: tenantSchoolSettingsSchema.nullable(),
  counts: tenantCountsSchema,
  alembic_head: z.string().nullable(),
  db_size_bytes: z.number(),
})
export type TenantDetail = z.infer<typeof tenantDetailSchema>

export const tenantProvisionRequestSchema = z.object({
  tenant_slug: z
    .string()
    .min(2)
    .max(63)
    .regex(/^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/, "minuscules + chiffres + tirets, sans tiret en début/fin"),
  school_name: z.string().min(1).max(255),
  admin_email: z.string().email(),
  admin_password: z.string().min(8),
  school_address: z.string().nullable().optional(),
  school_phone: z.string().nullable().optional(),
  school_email: z.string().email().nullable().optional().or(z.literal("")),
  ministry_code: z.string().nullable().optional(),
})
export type TenantProvisionRequest = z.infer<typeof tenantProvisionRequestSchema>

export const slugCheckResponseSchema = z.object({
  slug: z.string(),
  available: z.boolean(),
  valid_format: z.boolean(),
  reason: z.string().nullable(),
})
export type SlugCheckResponse = z.infer<typeof slugCheckResponseSchema>

export const patListItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  token_prefix: z.string(),
  scopes: z.array(z.string()),
  expires_at: z.string(),
  last_used_at: z.string().nullable(),
  revoked_at: z.string().nullable(),
  created_at: z.string(),
})
export type PATListItem = z.infer<typeof patListItemSchema>

export const patListResponseSchema = z.object({
  items: z.array(patListItemSchema),
  total: z.number(),
})

export const patCreateResponseSchema = patListItemSchema.extend({
  plaintext: z.string(),
})
export type PATCreateResponse = z.infer<typeof patCreateResponseSchema>

export const platformHealthSchema = z.object({
  overall: z.enum(["ok", "degraded", "down"]),
  checks: z.array(
    z.object({
      component: z.string(),
      status: z.enum(["ok", "degraded", "down"]),
      message: z.string().nullable(),
    }),
  ),
  timestamp: z.string(),
})
export type PlatformHealth = z.infer<typeof platformHealthSchema>
