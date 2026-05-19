import { z } from "zod"

// Miroir de app/schemas/payment.py (backend)
// Refactor 2026-05-17 : Payment cible enrollment_id + PaymentAllocation breakdown.

export const PaymentMethodSchema = z.enum(["cash", "mobile_money", "bank_transfer", "cheque"])

export const PaymentStatusSchema = z.enum([
  "pending",
  "completed",
  "failed",
  "refunded",
  "cancelled",
])

export const EnrollmentFeeStatusSchema = z.enum(["pending", "partial", "paid", "waived"])

// Split comptable d'un paiement vers un frais spécifique.
export const PaymentAllocationSchema = z.object({
  id: z.number(),
  enrollment_fee_id: z.number(),
  amount: z.coerce.number(),
  fee_category_name: z.string().nullable().optional(),
  fee_category_priority: z.number().nullable().optional(),
  enrollment_fee_status_after: z.string().nullable().optional(),
})

export const PaymentSchema = z.object({
  id: z.number(),
  enrollment_id: z.number(),
  // Champ legacy : null pour les paiements créés via le nouveau flow auto-alloc.
  enrollment_fee_id: z.number().nullable().optional(),
  amount: z.coerce.number(),
  method: PaymentMethodSchema,
  status: PaymentStatusSchema,
  reference: z.string().nullable(),
  notes: z.string().nullable().optional(),
  received_by: z.number().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  student_name: z.string().nullable().optional(),
  student_photo_url: z.string().nullable().optional(),
  fee_name: z.string().nullable().optional(),
  // BE renvoie toujours `allocations: []` au minimum. Optional côté TS pour
  // compat avec les call sites qui ne consomment pas ce champ.
  allocations: z.array(PaymentAllocationSchema).optional(),
})

// Body POST /payments (legacy) — cible un frais spécifique.
export const PaymentCreateSchema = z.object({
  enrollment_fee_id: z
    .number({ required_error: "Le frais d'inscription est requis" })
    .positive(),
  amount: z.string({ required_error: "Le montant est requis" }),
  method: PaymentMethodSchema,
  reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

// Body POST /enrollments/{id}/payments — flow Wave-style (cible).
export const EnrollmentPaymentCreateSchema = z.object({
  amount: z.coerce
    .number({
      required_error: "Le montant est requis",
      invalid_type_error: "Montant invalide",
    })
    .positive("Le montant doit être supérieur à zéro"),
  method: PaymentMethodSchema,
  reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

// Preview de l'allocation avant submit (UX caissier).
export const AllocationPreviewLineSchema = z.object({
  enrollment_fee_id: z.number(),
  fee_category_name: z.string(),
  fee_category_priority: z.number(),
  fee_total: z.coerce.number(),
  fee_paid_before: z.coerce.number(),
  allocated: z.coerce.number(),
  fee_paid_after: z.coerce.number(),
  status_after: EnrollmentFeeStatusSchema,
})

export const AllocationPreviewSchema = z.object({
  enrollment_id: z.number(),
  amount: z.coerce.number(),
  total_remaining_before: z.coerce.number(),
  total_remaining_after: z.coerce.number(),
  surplus: z.coerce.number(),
  can_record: z.boolean(),
  reject_reason: z.string().nullable(),
  lines: z.array(AllocationPreviewLineSchema),
})

export const FinancialSummarySchema = z.object({
  total_expected: z.number(),
  total_paid: z.number(),
  total_pending: z.number(),
  total_cancelled: z.number(),
  payment_count: z.number(),
  completion_rate: z.number(),
})

export const PaymentListParamsSchema = z.object({
  class_id: z.number().optional(),
  status: PaymentStatusSchema.optional(),
  method: PaymentMethodSchema.optional(),
  fee_category_id: z.number().optional(),
  enrollment_id: z.number().optional(),
  search: z.string().optional(),
  page: z.number().optional(),
  size: z.number().optional(),
})

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>
export type EnrollmentFeeStatus = z.infer<typeof EnrollmentFeeStatusSchema>
export type PaymentAllocation = z.infer<typeof PaymentAllocationSchema>
export type Payment = z.infer<typeof PaymentSchema>
export type PaymentCreate = z.infer<typeof PaymentCreateSchema>
export type EnrollmentPaymentCreate = z.infer<typeof EnrollmentPaymentCreateSchema>
export type AllocationPreviewLine = z.infer<typeof AllocationPreviewLineSchema>
export type AllocationPreview = z.infer<typeof AllocationPreviewSchema>
export type FinancialSummary = z.infer<typeof FinancialSummarySchema>
export type PaymentListParams = z.infer<typeof PaymentListParamsSchema>
