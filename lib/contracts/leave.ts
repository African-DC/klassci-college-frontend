import { z } from "zod"

export const LEAVE_TYPE_OPTIONS = [
  { value: "annual", label: "Congé annuel" },
  { value: "sick", label: "Congé maladie" },
  { value: "maternity", label: "Congé maternité" },
  { value: "exceptional", label: "Congé exceptionnel" },
  { value: "training", label: "Formation" },
  { value: "other", label: "Autre" },
] as const

const LEAVE_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  LEAVE_TYPE_OPTIONS.map((o) => [o.value, o.label]),
)

export function leaveTypeLabel(v?: string | null): string {
  if (!v) return "—"
  return LEAVE_TYPE_LABELS[v] ?? v
}

export const LEAVE_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Refusé",
  cancelled: "Annulé",
}

export const LeaveRequestSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  leave_type: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  reason: z.string().nullish(),
  status: z.string(),
  reviewed_by: z.number().nullish(),
  reviewed_at: z.string().nullish(),
  review_comment: z.string().nullish(),
  created_at: z.string(),
  requester_name: z.string().nullish(),
  requester_role: z.string().nullish(),
})

export const LeaveCreateSchema = z
  .object({
    leave_type: z.string({ required_error: "Type requis" }).min(1, "Type requis"),
    start_date: z.string({ required_error: "Date de début requise" }).min(1, "Date de début requise"),
    end_date: z.string({ required_error: "Date de fin requise" }).min(1, "Date de fin requise"),
    reason: z.string().optional(),
  })
  .refine((d) => d.end_date >= d.start_date, {
    message: "La date de fin doit être postérieure ou égale au début",
    path: ["end_date"],
  })

export type LeaveRequest = z.infer<typeof LeaveRequestSchema>
export type LeaveCreate = z.infer<typeof LeaveCreateSchema>
