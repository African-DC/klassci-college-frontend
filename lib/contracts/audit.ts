import { z } from "zod"

/**
 * Une ligne du journal : quand, qui, quoi, sur quoi.
 *
 * `actor_email` et `actor_role` sont figés au moment de l'action ; `actor_name`
 * est résolu à la lecture depuis les fiches. Un compte supprimé garde donc son
 * adresse dans le journal même si son nom n'est plus retrouvable.
 */
export const AuditEntrySchema = z.object({
  id: z.number(),
  created_at: z.string(),
  action: z.string(),
  entity_type: z.string(),
  entity_id: z.number().nullish(),
  user_id: z.number().nullish(),
  actor_name: z.string().nullish(),
  actor_email: z.string().nullish(),
  actor_role: z.string().nullish(),
  ip_address: z.string().nullish(),
  notes: z.string().nullish(),
  old_values: z.record(z.unknown()).nullish(),
  new_values: z.record(z.unknown()).nullish(),
})

export const AuditListSchema = z.object({
  items: z.array(AuditEntrySchema),
  total: z.number(),
  page: z.number(),
  size: z.number(),
})

export const AuditActorOptionSchema = z.object({
  user_id: z.number(),
  name: z.string().nullish(),
  email: z.string().nullish(),
})

export const AuditFiltersSchema = z.object({
  entity_types: z.array(z.string()),
  actions: z.array(z.string()),
  actors: z.array(AuditActorOptionSchema),
  /** `full` ou `financial` : l'écran doit dire au comptable qu'il voit une partie. */
  scope: z.string(),
})

export type AuditEntry = z.infer<typeof AuditEntrySchema>
export type AuditList = z.infer<typeof AuditListSchema>
export type AuditActorOption = z.infer<typeof AuditActorOptionSchema>
export type AuditFilters = z.infer<typeof AuditFiltersSchema>

export interface AuditQuery {
  entity_type?: string
  entity_id?: number
  action?: string
  user_id?: number
  date_from?: string
  date_to?: string
  search?: string
  page?: number
  size?: number
}
