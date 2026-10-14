import { z } from "zod"

// Miroir de app/schemas/fee_discount.py. Les DECIMAL arrivent en chaînes.
export const FeeDiscountSchema = z.object({
  enrollment_fee_id: z.number(),
  original_amount: z.coerce.number(),
  discount_amount: z.coerce.number(),
  amount_due: z.coerce.number(),
  kind: z.enum(["fixed", "percent"]),
  value: z.coerce.number(),
  reason: z.string(),
  granted_by: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const FeeDiscountUpsertSchema = z.object({
  kind: z.enum(["fixed", "percent"]),
  value: z.coerce.number().positive("Saisissez une réduction positive"),
  reason: z.string().trim().min(5, "Précisez le motif (5 caractères minimum)").max(500),
}).superRefine((data, ctx) => {
  if (data.kind === "percent" && data.value > 100) {
    ctx.addIssue({ code: "custom", path: ["value"], message: "100 % maximum" })
  }
  if (!Number.isFinite(data.value) || Math.abs(Math.round(data.value * 100) - data.value * 100) > 1e-7) {
    ctx.addIssue({ code: "custom", path: ["value"], message: "Deux décimales maximum" })
  }
})

export type FeeDiscount = z.infer<typeof FeeDiscountSchema>
export type FeeDiscountUpsert = z.infer<typeof FeeDiscountUpsertSchema>

export function calculateFeeDiscount(base: number, input: FeeDiscountUpsert): number {
  const raw = input.kind === "percent" ? base * input.value / 100 : input.value
  return Math.round((raw + Number.EPSILON) * 100) / 100
}
