import { z } from "zod"

// Match BE app/schemas/admin.py — promotion DTOs (cycle 3 plan B).

export const PromotionPreviewRequestSchema = z.object({
  source_ay_id: z.number().int().positive(),
  target_ay_id: z.number().int().positive(),
  class_mapping: z.record(z.string(), z.number().int().positive()),
})
export type PromotionPreviewRequest = z.infer<typeof PromotionPreviewRequestSchema>

export const SourceClassSummarySchema = z.object({
  source_class_id: z.number(),
  target_class_id: z.number(),
  target_class_name: z.string(),
  students_to_promote: z.number(),
  target_capacity: z.number(),
  target_remaining: z.number(),
})
export type SourceClassSummary = z.infer<typeof SourceClassSummarySchema>

export const PromotionCapacityWarningSchema = z.object({
  source_class_id: z.number(),
  target_class_id: z.number(),
  target_class_name: z.string(),
  requested: z.number(),
  available: z.number(),
  overflow: z.number(),
})
export type PromotionCapacityWarning = z.infer<typeof PromotionCapacityWarningSchema>

export const PromotionPreviewResponseSchema = z.object({
  source_ay_id: z.number(),
  target_ay_id: z.number(),
  source_classes: z.array(SourceClassSummarySchema),
  capacity_warnings: z.array(PromotionCapacityWarningSchema),
  promotable_count: z.number(),
})
export type PromotionPreviewResponse = z.infer<typeof PromotionPreviewResponseSchema>

export const PromotionExecuteRequestSchema = PromotionPreviewRequestSchema
export type PromotionExecuteRequest = z.infer<typeof PromotionExecuteRequestSchema>

export const PromotionExecuteErrorSchema = z.object({
  student_id: z.number(),
  source_enrollment_id: z.number(),
  reason: z.string(),
})
export type PromotionExecuteError = z.infer<typeof PromotionExecuteErrorSchema>

export const PromotionExecuteResponseSchema = z.object({
  source_ay_id: z.number(),
  target_ay_id: z.number(),
  promoted_count: z.number(),
  promoted_enrollment_ids: z.array(z.number()),
  skipped_count: z.number(),
  error_count: z.number(),
  errors: z.array(PromotionExecuteErrorSchema),
})
export type PromotionExecuteResponse = z.infer<typeof PromotionExecuteResponseSchema>
