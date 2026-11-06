import { z } from "zod"

/** La dette et les retards ne sont servis qu'avec payments:read:all. */
export const ScheduleOverviewStateSchema = z.enum([
  "all",
  "late",
  "on_track",
  "settled",
  "unconfigured",
  "partial_schedule",
  "no_fees",
])

export const ScheduleOverviewRowSchema = z.object({
  enrollment_id: z.number(),
  student_name: z.string(),
  matricule: z.string().nullish(),
  class_id: z.number(),
  class_name: z.string(),
  source: z.enum(["negotiated", "standard", "none"]),
  state: ScheduleOverviewStateSchema.exclude(["all"]),
  total_due: z.number(),
  total_paid: z.number(),
  remaining: z.number(),
  due_so_far: z.number(),
  late_amount: z.number(),
  unscheduled_amount: z.number(),
  next_due_date: z.string().nullish(),
  next_due_amount: z.number().nullish(),
})

export const ScheduleOverviewResponseSchema = z.object({
  items: z.array(ScheduleOverviewRowSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  size: z.number().int().positive(),
  totals: z.object({
    enrollments: z.number().int(),
    late_enrollments: z.number().int(),
    total_due: z.number(),
    total_paid: z.number(),
    total_remaining: z.number(),
    total_late: z.number(),
  }),
})

export type ScheduleOverviewState = z.infer<typeof ScheduleOverviewStateSchema>
export type ScheduleOverviewRow = z.infer<typeof ScheduleOverviewRowSchema>
export type ScheduleOverviewResponse = z.infer<typeof ScheduleOverviewResponseSchema>

export interface ScheduleOverviewParams {
  academic_year_id: number
  class_id?: number
  search?: string
  state?: ScheduleOverviewState
  page?: number
  size?: number
}

export const SCHEDULE_STATES: { value: ScheduleOverviewState; label: string }[] = [
  { value: "all", label: "Tous les états" },
  { value: "late", label: "En retard" },
  { value: "on_track", label: "À jour" },
  { value: "settled", label: "Soldés" },
  { value: "unconfigured", label: "Sans grille" },
  { value: "partial_schedule", label: "Partiellement planifiés" },
  { value: "no_fees", label: "Sans frais" },
]

/** Le filtre parle d'un ensemble (« Soldés »), le badge d'un seul élève (« Soldé »). */
const ROW_LABELS: Partial<Record<ScheduleOverviewState, string>> = {
  settled: "Soldé",
  partial_schedule: "Partiellement planifié",
}

export function scheduleStatusLabel(state: string): string {
  return (
    ROW_LABELS[state as ScheduleOverviewState] ??
    SCHEDULE_STATES.find((entry) => entry.value === state)?.label ??
    state
  )
}

export function scheduleSourceLabelForRow(source: string): string {
  switch (source) {
    case "negotiated": return "Accord individuel"
    case "standard": return "Grille établissement"
    default: return "Non planifié"
  }
}
