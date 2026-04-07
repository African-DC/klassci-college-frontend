import { z } from "zod"

// Miroir de app/schemas/payment.py (backend)

export const PaymentMethodSchema = z.enum(["cash", "mobile_money", "bank_transfer", "check"])

export const PaymentStatusSchema = z.enum(["en_attente", "valide", "annule"])

export const PaymentSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  student_name: z.string(),
  class_name: z.string(),
  fee_category_id: z.number(),
  fee_category_name: z.string(),
  amount: z.number(),
  method: PaymentMethodSchema,
  status: PaymentStatusSchema,
  reference: z.string().nullable(),
  paid_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const PaymentCreateSchema = z.object({
  enrollment_fee_id: z.number({ required_error: "Le frais d'inscription est requis" }).positive(),
  amount: z.string({ required_error: "Le montant est requis" }),
  method: PaymentMethodSchema,
  reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

// Résumé financier pour le dashboard
export const FinancialSummarySchema = z.object({
  total_expected: z.number(),
  total_collected: z.number(),
  total_pending: z.number(),
  collection_rate: z.number(),
  by_category: z.array(
    z.object({
      category_name: z.string(),
      expected: z.number(),
      collected: z.number(),
      rate: z.number(),
    }),
  ),
  by_method: z.array(
    z.object({
      method: PaymentMethodSchema,
      total: z.number(),
      count: z.number(),
    }),
  ),
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
