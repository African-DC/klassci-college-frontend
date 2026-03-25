"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { paymentsApi } from "@/lib/api/payments"
import type { PaymentCreate, PaymentListParams } from "@/lib/contracts/payment"

export const paymentKeys = {
  all: ["payments"] as const,
  list: (params: PaymentListParams) => ["payments", "list", params] as const,
  summary: (academicYearId?: number) => ["payments", "summary", academicYearId] as const,
}

export function usePayments(params: PaymentListParams = {}) {
  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: () => paymentsApi.list(params),
    staleTime: 1000 * 60 * 5,
  })
}

export function useFinancialSummary(academicYearId?: number) {
  return useQuery({
    queryKey: paymentKeys.summary(academicYearId),
    queryFn: () => paymentsApi.getSummary(academicYearId),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PaymentCreate) => paymentsApi.create(data),
    onSuccess: () => {
      toast.success("Paiement enregistré")
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
    },
    onError: (err) => toast.error("Erreur", { description: err.message }),
  })
}

export function useValidatePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => paymentsApi.validate(id),
    onSuccess: () => {
      toast.success("Paiement validé")
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
    },
    onError: (err) => toast.error("Erreur", { description: err.message }),
  })
}

export function useCancelPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => paymentsApi.cancel(id),
    onSuccess: () => {
      toast.success("Paiement annulé")
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
    },
    onError: (err) => toast.error("Erreur", { description: err.message }),
  })
}
