import { z } from "zod"

export const DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"] as const
export const EVENT_CATEGORIES = ["recess", "lunch", "interclass", "study", "assembly", "other"] as const
export const EVENT_LABELS: Record<(typeof EVENT_CATEGORIES)[number], string> = {
  recess: "Récréation",
  lunch: "Pause déjeuner",
  interclass: "Interclasse",
  study: "Étude surveillée",
  assembly: "Rassemblement",
  other: "Autre activité",
}

export const ScheduleEventCreateSchema = z.object({
  academic_year_id: z.number().int().positive(),
  class_id: z.number().int().positive().nullable(),
  title: z.string().trim().min(1, "Indiquez un titre").max(100),
  category: z.enum(EVENT_CATEGORIES),
  blocks_courses: z.boolean(),
  day: z.enum(DAYS),
  start_time: z.string().regex(/^([01]\\d|2[0-3]):[0-5]\\d$/, "Heure invalide"),
  end_time: z.string().regex(/^([01]\\d|2[0-3]):[0-5]\\d$/, "Heure invalide"),
}).refine(v => v.start_time < v.end_time, {
  path: ["end_time"],
  message: "L'heure de fin doit être après l'heure de début",
})
export const ScheduleEventSchema = ScheduleEventCreateSchema.extend({ id: z.number() })
export type ScheduleEvent = z.infer<typeof ScheduleEventSchema>
export type ScheduleEventCreate = z.infer<typeof ScheduleEventCreateSchema>
