import { z } from "zod"

export const incidentStatus = z.enum(["new", "in_progress", "waiting", "resolved", "closed"])
export const incidentPriority = z.enum(["low", "normal", "high", "critical"])
export const incidentEventSchema = z.object({
  id: z.number(),
  actor_kind: z.string(),
  status: z.string().nullable(),
  message: z.string().nullable(),
  created_at: z.string(),
})
export const incidentSchema = z.object({
  id: z.string(),
  reference: z.string().nullable(),
  title: z.string(),
  description: z.string(),
  status: incidentStatus,
  priority: incidentPriority,
  source: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  resolved_at: z.string().nullable(),
  events: z.array(incidentEventSchema).default([]),
})
export const incidentPageSchema = z.object({
  items: z.array(incidentSchema),
  total: z.number(),
  page: z.number(),
  size: z.number(),
})
export type Incident = z.infer<typeof incidentSchema>
export type IncidentPage = z.infer<typeof incidentPageSchema>
export type IncidentStatus = z.infer<typeof incidentStatus>
export type IncidentPriority = z.infer<typeof incidentPriority>

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  new: "Nouveau", in_progress: "En cours", waiting: "En attente",
  resolved: "Résolu", closed: "Fermé",
}
export const PRIORITY_LABELS: Record<IncidentPriority, string> = {
  low: "Basse", normal: "Normale", high: "Haute", critical: "Critique",
}
