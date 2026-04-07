import { z } from "zod"

// Miroir de app/schemas/council.py (backend)

// Decisions du conseil de classe — seuils ivoiriens
// >= 10    -> passage
// 9.5–9.99 -> repechage
// 8.5–9.49 -> redoublement
// < 8.5   -> exclusion
export const CouncilDecisionSchema = z.enum([
  "passage",
  "repechage",
  "redoublement",
  "exclusion",
])

export const CouncilDecisionRecordSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  student_name: z.string(),
  average: z.coerce.number().nullable(),
  rank: z.number().nullable(),
  absence_count: z.number().default(0),
  auto_decision: CouncilDecisionSchema.nullable(),
  final_decision: CouncilDecisionSchema.nullable(),
  override_reason: z.string().nullable(),
})

export const CouncilMinutesSchema = z.object({
  id: z.number(),
  class_id: z.number(),
  class_name: z.string(),
  trimester: z.coerce.number(),
  academic_year_id: z.number(),
  is_published: z.boolean(),
  decisions: z.array(CouncilDecisionRecordSchema),
  main_teacher_name: z.string().nullable(),
  director_name: z.string().nullable(),
  dren_name: z.string().nullable(),
  notes: z.string().nullable(),
  generated_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const CouncilDecisionUpdateSchema = z.object({
  student_id: z.number(),
  final_decision: CouncilDecisionSchema,
  override_reason: z.string().nullable().optional(),
})

export type CouncilDecision = z.infer<typeof CouncilDecisionSchema>
export type CouncilDecisionRecord = z.infer<typeof CouncilDecisionRecordSchema>
export type CouncilMinutes = z.infer<typeof CouncilMinutesSchema>
export type CouncilDecisionUpdate = z.infer<typeof CouncilDecisionUpdateSchema>
