"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { feeDiscountsApi } from "@/lib/api/fee-discounts"
import type { FeeDiscountUpsert } from "@/lib/contracts/fee-discount"

export const feeDiscountKeys = {
  all: ["fee-discounts"] as const,
  enrollment: (id: number) => ["fee-discounts", "enrollment", id] as const,
}

export function useFeeDiscounts(enrollmentId: number, enabled: boolean) {
  return useQuery({
    queryKey: feeDiscountKeys.enrollment(enrollmentId),
    queryFn: () => feeDiscountsApi.list(enrollmentId),
    enabled: enabled && enrollmentId > 0,
  })
}

function useInvalidateFeeViews(enrollmentId: number, studentId: number) {
  const qc = useQueryClient()
  return async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: feeDiscountKeys.enrollment(enrollmentId) }),
      qc.invalidateQueries({ queryKey: ["students", studentId] }),
      qc.invalidateQueries({ queryKey: ["payments"] }),
      qc.invalidateQueries({ queryKey: ["enrollments"] }),
      qc.invalidateQueries({ queryKey: ["installments"] }),
      qc.invalidateQueries({ queryKey: ["dashboard"] }),
    ])
  }
}

export function useSetFeeDiscount(enrollmentId: number, studentId: number) {
  const invalidate = useInvalidateFeeViews(enrollmentId, studentId)
  return useMutation({
    mutationFn: ({ feeId, input }: { feeId: number; input: FeeDiscountUpsert }) =>
      feeDiscountsApi.set(enrollmentId, feeId, input),
    onSuccess: async () => {
      await invalidate()
      toast.success("Réduction enregistrée sur les frais de l'inscription")
    },
    onError: (error: Error) => toast.error("Réduction refusée", { description: error.message }),
  })
}

export function useRemoveFeeDiscount(enrollmentId: number, studentId: number) {
  const invalidate = useInvalidateFeeViews(enrollmentId, studentId)
  return useMutation({
    mutationFn: (feeId: number) => feeDiscountsApi.remove(enrollmentId, feeId),
    onSuccess: async () => {
      await invalidate()
      toast.success("Réduction annulée : montant initial restauré")
    },
    onError: (error: Error) => toast.error("Annulation refusée", { description: error.message }),
  })
}
