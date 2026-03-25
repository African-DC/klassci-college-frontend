import { z } from "zod"

// Miroir de app/schemas/council.py (backend)

// Décisions du conseil de classe — seuils ivoiriens
// ≥ 10    → passage
// 9.5–9.99 → repêchage
// 8.5–9.49 → redoublement
// < 8.5   → exclusion
export const CouncilDecisionSchema = z.enum([
  "passage",
  "repechage",
  "redoublement",
  "exclusion",
])

export const CouncilStatusSchema = z.enum(["brouillon", "valide"])

export const CouncilRecordSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  student_name: z.string(),
  average: z.number().nullable(),
  rank: z.number().nullable(),
  total_students: z.number(),
  auto_decision: CouncilDecisionSchema.nullable(),
  final_decision: CouncilDecisionSchema.nullable(),
  override_reason: z.string().nullable(),
})

export const CouncilMinutesSchema = z.object({
  id: z.number(),
  class_id: z.number(),
  class_name: z.string(),
  trimester: z.enum(["1", "2", "3"]),
  academic_year_id: z.number(),
  academic_year_label: z.string(),
  status: CouncilStatusSchema,
  records: z.array(CouncilRecordSchema),
  council_date: z.string().nullable(),
  president_name: z.string().nullable(),
  secretary_name: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const CouncilDecisionUpdateSchema = z.object({
  student_id: z.number(),
  final_decision: CouncilDecisionSchema,
  override_reason: z.string().nullable().optional(),
})

export type CouncilDecision = z.infer<typeof CouncilDecisionSchema>
export type CouncilStatus = z.infer<typeof CouncilStatusSchema>
export type CouncilRecord = z.infer<typeof CouncilRecordSchema>
export type CouncilMinutes = z.infer<typeof CouncilMinutesSchema>
export type CouncilDecisionUpdate = z.infer<typeof CouncilDecisionUpdateSchema>
