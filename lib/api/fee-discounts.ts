import { z } from "zod"
import { apiFetch, safeValidate } from "@/lib/api/client"

export const DiscountLineSchema = z.object({
  fee_id: z.number(),
  category_name: z.string(),
  original_amount: z.coerce.number(),
  payable_amount: z.coerce.number(),
  discount_kind: z.enum(["fixed", "percent"]).nullable(),
  discount_value: z.coerce.number().nullable(),
  discount_amount: z.coerce.number(),
  discount_reason: z.string().nullable(),
})
export type DiscountLine = z.infer<typeof DiscountLineSchema>
export interface DiscountInput {
  kind: "fixed" | "percent"
  value: number
  reason: string
}
const linesSchema = z.array(DiscountLineSchema)
const base = (enrollmentId: number) => `/enrollments/${enrollmentId}/fee-discounts`

export const feeDiscountApi = {
  list: async (enrollmentId: number) =>
    safeValidate(linesSchema, await apiFetch<unknown>(base(enrollmentId)), "GET fee-discounts"),
  set: async (enrollmentId: number, feeId: number, data: DiscountInput) =>
    safeValidate(DiscountLineSchema, await apiFetch<unknown>(`${base(enrollmentId)}/${feeId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }), "PUT fee-discounts"),
  remove: async (enrollmentId: number, feeId: number) =>
    safeValidate(DiscountLineSchema, await apiFetch<unknown>(`${base(enrollmentId)}/${feeId}`, {
      method: "DELETE",
    }), "DELETE fee-discounts"),
}
