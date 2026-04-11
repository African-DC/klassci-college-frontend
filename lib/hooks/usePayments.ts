"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { paymentsApi } from "@/lib/api/payments"
import type { Payment, PaymentCreate, PaymentListParams } from "@/lib/contracts/payment"
import type { PaginatedResponse } from "@/lib/contracts"

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

/** Met à jour optimistiquement le statut d'un paiement dans le cache paginé */
function optimisticStatusUpdate(
  queryClient: ReturnType<typeof useQueryClient>,
  paymentId: number,
  newStatus: Payment["status"],
) {
  // Met à jour dans toutes les listes paginées en cache
  queryClient.setQueriesData<PaginatedResponse<Payment>>(
    { queryKey: paymentKeys.all },
    (old) => {
      if (!old) return old
      return {
        ...old,
        items: old.items.map((p) =>
          p.id === paymentId ? { ...p, status: newStatus } : p,
        ),
      }
    },
  )
}

export function useValidatePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => paymentsApi.validate(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: paymentKeys.all })
      // Snapshot pour rollback
      const snapshots = queryClient.getQueriesData<PaginatedResponse<Payment>>({
        queryKey: paymentKeys.all,
      })
      optimisticStatusUpdate(queryClient, id, "completed")
      return { snapshots }
    },
    onSuccess: () => toast.success("Paiement validé"),
    onError: (err, _id, ctx) => {
      ctx?.snapshots?.forEach(([key, data]) => {
        if (data) queryClient.setQueryData(key, data)
      })
      toast.error("Erreur", { description: err.message })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      queryClient.invalidateQueries({ queryKey: paymentKeys.summary() })
    },
  })
}

export function useCancelPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => paymentsApi.cancel(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: paymentKeys.all })
      const snapshots = queryClient.getQueriesData<PaginatedResponse<Payment>>({
        queryKey: paymentKeys.all,
      })
      optimisticStatusUpdate(queryClient, id, "cancelled")
      return { snapshots }
    },
    onSuccess: () => toast.success("Paiement annulé"),
    onError: (err, _id, ctx) => {
      ctx?.snapshots?.forEach(([key, data]) => {
        if (data) queryClient.setQueryData(key, data)
      })
      toast.error("Erreur", { description: err.message })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      queryClient.invalidateQueries({ queryKey: paymentKeys.summary() })
    },
  })
}
