import { z } from "zod"
import {
  FeeDiscountSchema, type FeeDiscount, type FeeDiscountUpsert,
} from "@/lib/contracts/fee-discount"
import { apiFetch, safeValidate } from "./client"

export const feeDiscountsApi = {
  list: async (enrollmentId: number): Promise<FeeDiscount[]> => {
    const json = await apiFetch<unknown>(`/enrollments/${enrollmentId}/discounts`)
    return safeValidate(z.array(FeeDiscountSchema), json, "GET enrollment discounts")
  },
  set: async (enrollmentId: number, feeId: number, data: FeeDiscountUpsert): Promise<FeeDiscount> => {
    const json = await apiFetch<unknown>(`/enrollments/${enrollmentId}/fees/${feeId}/discount`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return safeValidate(FeeDiscountSchema, json, "PUT enrollment fee discount")
  },
  remove: async (enrollmentId: number, feeId: number): Promise<void> => {
    await apiFetch<unknown>(`/enrollments/${enrollmentId}/fees/${feeId}/discount`, { method: "DELETE" })
  },
}
