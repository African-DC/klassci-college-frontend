import { z } from "zod"

// Miroir de app/schemas/payment.py (backend)

export const PaymentMethodSchema = z.enum(["cash", "mobile_money", "bank_transfer", "cheque"])

export const PaymentStatusSchema = z.enum(["pending", "completed", "failed", "refunded"])

export const PaymentSchema = z.object({
  id: z.number(),
  enrollment_fee_id: z.number(),
  amount: z.union([z.number(), z.string().transform(Number)]),
  method: PaymentMethodSchema,
  status: PaymentStatusSchema,
  reference: z.string().nullable(),
  received_by: z.number().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const PaymentCreateSchema = z.object({
  enrollment_fee_id: z.number({ required_error: "Le frais d'inscription est requis" }).positive(),
  amount: z.number({ required_error: "Le montant est requis" }).positive("Le montant doit être positif"),
  method: PaymentMethodSchema,
  reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

// Résumé financier pour le dashboard
export const FinancialSummarySchema = z.object({
  total_expected: z.union([z.number(), z.string().transform(Number)]),
  total_collected: z.union([z.number(), z.string().transform(Number)]),
  total_pending: z.union([z.number(), z.string().transform(Number)]),
  collection_rate: z.union([z.number(), z.string().transform(Number)]),
  by_category: z.array(
    z.object({
      category_name: z.string(),
      expected: z.union([z.number(), z.string().transform(Number)]),
      collected: z.union([z.number(), z.string().transform(Number)]),
      rate: z.union([z.number(), z.string().transform(Number)]),
    }),
  ),
  by_method: z.array(
    z.object({
      method: PaymentMethodSchema,
      total: z.union([z.number(), z.string().transform(Number)]),
      count: z.number(),
    }),
  ),
})

export const PaymentListParamsSchema = z.object({
  class_id: z.number().optional(),
  status: PaymentStatusSchema.optional(),
  method: PaymentMethodSchema.optional(),
  enrollment_fee_id: z.number().optional(),
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
