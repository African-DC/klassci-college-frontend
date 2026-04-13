import { z } from "zod"

// Miroir de app/schemas/payment.py (backend)

export const PaymentMethodSchema = z.enum(["cash", "mobile_money", "bank_transfer", "check"])

export const PaymentStatusSchema = z.enum(["pending", "completed", "failed", "refunded", "cancelled"])

export const PaymentSchema = z.object({
  id: z.number(),
  enrollment_fee_id: z.number(),
  amount: z.coerce.number(),
  method: PaymentMethodSchema,
  status: PaymentStatusSchema,
  reference: z.string().nullable(),
  notes: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
}).passthrough()

export const PaymentCreateSchema = z.object({
  enrollment_fee_id: z.number({ required_error: "Le frais d'inscription est requis" }).positive(),
  amount: z.string({ required_error: "Le montant est requis" }),
  method: PaymentMethodSchema,
  reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

// Résumé financier — miroir de PaymentSummaryResponse (backend)
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
  search: z.string().optional(),
  page: z.number().optional(),
  size: z.number().optional(),
})

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>
export type Payment = z.infer<typeof PaymentSchema>
export type PaymentCreate = z.infer<typeof PaymentCreateSchema>
export type FinancialSummary = z.infer<typeof FinancialSummarySchema>
export type PaymentListParams = z.infer<typeof PaymentListParamsSchema>
