"use client"

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { toast } from "sonner"
import { paymentsApi } from "@/lib/api/payments"
import type {
  EnrollmentPaymentCreate,
  Payment,
  PaymentCreate,
  PaymentListParams,
} from "@/lib/contracts/payment"
import type { PaginatedResponse } from "@/lib/contracts"

export const paymentKeys = {
  all: ["payments"] as const,
  list: (params: PaymentListParams) => ["payments", "list", params] as const,
  summary: (academicYearId?: number) => ["payments", "summary", academicYearId] as const,
  cashiers: ["payments", "cashiers"] as const,
  byEnrollment: (enrollmentId: number) =>
    ["payments", "enrollment", enrollmentId] as const,
  preview: (enrollmentId: number, amount: number) =>
    ["payments", "preview", enrollmentId, amount] as const,
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

/**
 * Les encaisseurs proposables dans le filtre « Encaissé par ».
 *
 * Le serveur décide de ce que l'appelant a le droit d'y voir : un caissier
 * cloisonné ne reçoit que lui-même. Le composant n'a donc pas à connaître les
 * droits de celui qui ouvre l'écran.
 */
export function useCashiers() {
  return useQuery({
    queryKey: paymentKeys.cashiers,
    queryFn: () => paymentsApi.listCashiers(),
    staleTime: 1000 * 60 * 10,
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

/** Historique des paiements d'une inscription (nouveau path REST nested) */
export function useEnrollmentPayments(enrollmentId: number | null) {
  return useQuery({
    queryKey: paymentKeys.byEnrollment(enrollmentId ?? 0),
    queryFn: () => paymentsApi.listByEnrollment(enrollmentId as number),
    enabled: Number.isFinite(enrollmentId) && (enrollmentId ?? 0) > 0,
    staleTime: 1000 * 30,
  })
}

/** Preview d'allocation (debounce côté composant pour éviter le spam BE) */
export function useAllocationPreview(
  enrollmentId: number | null,
  amount: number | null,
) {
  return useQuery({
    queryKey: paymentKeys.preview(enrollmentId ?? 0, amount ?? 0),
    queryFn: () =>
      paymentsApi.previewAllocation(enrollmentId as number, amount as number),
    enabled:
      Number.isFinite(enrollmentId) &&
      (enrollmentId ?? 0) > 0 &&
      Number.isFinite(amount) &&
      (amount ?? 0) > 0,
    staleTime: 1000 * 10,
    placeholderData: keepPreviousData,
  })
}

/** Versement caissier auto-alloué (flow cible) */
export function useRecordEnrollmentPayment(enrollmentId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: EnrollmentPaymentCreate) =>
      paymentsApi.recordOnEnrollment(enrollmentId, data),
    onSuccess: (payment) => {
      const allocCount = payment.allocations?.length ?? 0
      const breakdown =
        allocCount > 0
          ? ` (${allocCount} frais alloué${allocCount > 1 ? "s" : ""})`
          : ""
      toast.success("Versement enregistré", {
        description: `${Number(payment.amount).toLocaleString("fr-FR")} XOF${breakdown}`,
      })
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      queryClient.invalidateQueries({
        queryKey: paymentKeys.byEnrollment(enrollmentId),
      })
      // Les frais et le résumé étudiant changent aussi
      queryClient.invalidateQueries({ queryKey: ["enrollments"] })
      queryClient.invalidateQueries({ queryKey: ["students"] })
      queryClient.invalidateQueries({ queryKey: ["fees"] })
    },
    onError: (err) =>
      toast.error("Versement refusé", { description: err.message }),
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
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      paymentsApi.cancel(id, reason),
    onMutate: async ({ id }) => {
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
