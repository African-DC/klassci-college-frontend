"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { feeDiscountApi, type DiscountInput } from "@/lib/api/fee-discounts"

const key = (enrollmentId: number) => ["enrollments", enrollmentId, "fee-discounts"] as const

export function useEnrollmentFeeDiscounts(enrollmentId: number, enabled: boolean) {
  return useQuery({
    queryKey: key(enrollmentId),
    queryFn: () => feeDiscountApi.list(enrollmentId),
    enabled,
  })
}

export function useFeeDiscountActions(enrollmentId: number, studentId: number) {
  const qc = useQueryClient()
  const refresh = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: key(enrollmentId) }),
      qc.invalidateQueries({ queryKey: ["students", studentId, "fees"] }),
      qc.invalidateQueries({ queryKey: ["installments"] }),
      qc.invalidateQueries({ queryKey: ["payments"] }),
      qc.invalidateQueries({ queryKey: ["dashboard"] }),
    ])
  }
  const set = useMutation({
    mutationFn: ({ feeId, data }: { feeId: number; data: DiscountInput }) =>
      feeDiscountApi.set(enrollmentId, feeId, data),
    onSuccess: async () => { await refresh(); toast.success("Réduction enregistrée") },
    onError: (error: Error) => toast.error("Réduction refusée", { description: error.message }),
  })
  const remove = useMutation({
    mutationFn: (feeId: number) => feeDiscountApi.remove(enrollmentId, feeId),
    onSuccess: async () => { await refresh(); toast.success("Réduction retirée") },
    onError: (error: Error) => toast.error("Retrait refusé", { description: error.message }),
  })
  return { set, remove }
}
