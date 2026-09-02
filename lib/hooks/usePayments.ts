"use client"

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"
import { paymentsApi } from "@/lib/api/payments"
import { pageSuivante } from "./pagination"
import type {
  EnrollmentPaymentCreate,
  Payment,
  PaymentAllocationInput,
  PaymentCreate,
  PaymentListParams,
} from "@/lib/contracts/payment"
import type { PaginatedResponse } from "@/lib/contracts"

export const paymentKeys = {
  all: ["payments"] as const,
  list: (params: PaymentListParams) => ["payments", "list", params] as const,
  summary: (academicYearId?: number, filtres?: PaymentListParams) =>
    ["payments", "summary", academicYearId, filtres] as const,
  cashiers: ["payments", "cashiers"] as const,
  byEnrollment: (enrollmentId: number) =>
    ["payments", "enrollment", enrollmentId] as const,
  preview: (
    enrollmentId: number,
    amount: number,
    allocations: PaymentAllocationInput[] | undefined,
  ) => ["payments", "preview", enrollmentId, amount, allocations ?? null] as const,
}

/** Les seules entrées du cache qui contiennent une page de versements. */
const estListePaginee = (cle: readonly unknown[]): boolean =>
  cle[1] === "list" || cle[1] === "enrollment"


export function usePayments(params: PaymentListParams = {}) {
  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: () => paymentsApi.list(params),
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Les chiffres du bandeau, calcules sur le perimetre de l'ecran.
 *
 * Les filtres partent au serveur : agreger ce qui est charge donnerait des
 * totaux faux des la deuxieme page, et un bandeau qui ignore les filtres
 * annonce l'annee entiere au-dessus d'une liste qui montre trois lignes.
 */
export function useFinancialSummary(academicYearId?: number, filtres?: PaymentListParams) {
  return useQuery({
    queryKey: paymentKeys.summary(academicYearId, filtres),
    queryFn: () => paymentsApi.getSummary(academicYearId, filtres),
    enabled: academicYearId != null,
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

/** Preview d'allocation (debounce côté composant pour éviter le spam BE)
 *
 * `allocations` porte la répartition que le caissier a nommée. Elle entre dans
 * la clé de cache : deux répartitions différentes du même montant sont deux
 * réponses différentes, et servir l'une pour l'autre afficherait à l'écran une
 * ventilation qui n'est pas celle qu'on vient de taper.
 */
export function useAllocationPreview(
  enrollmentId: number | null,
  amount: number | null,
  allocations?: PaymentAllocationInput[],
) {
  return useQuery({
    queryKey: paymentKeys.preview(enrollmentId ?? 0, amount ?? 0, allocations),
    queryFn: () =>
      paymentsApi.previewAllocation(
        enrollmentId as number,
        amount as number,
        allocations,
      ),
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

/**
 * Met à jour optimistiquement le statut d'un paiement dans les listes paginées.
 *
 * Le préfixe `["payments"]` ramène aussi `["payments", "summary", …]`, dont la
 * valeur est un récapitulatif financier sans `items`, et `["payments",
 * "cashiers"]`, qui est une simple liste. Écrire dedans jetait
 * « Cannot read properties of undefined » avant que la requête ne parte : la
 * validation et l'annulation d'un versement échouaient sur l'écran des
 * paiements, qui affiche justement le récapitulatif à côté de la liste.
 */
function optimisticStatusUpdate(
  queryClient: ReturnType<typeof useQueryClient>,
  paymentId: number,
  newStatus: Payment["status"],
) {
  const remplace = (p: Payment) => (p.id === paymentId ? { ...p, status: newStatus } : p)

  // Deux formes de cache cohabitent sous le meme prefixe depuis le
  // defilement continu : la page unique `{items}` et la liste accumulee
  // `{pages}`. Ne traiter que la premiere ne jetait pas d erreur, elle ne
  // faisait rien : la ligne qu on venait de valider restait inchangee
  // jusqu au rechargement, qui redemande toutes les pages chargees.
  queryClient.setQueriesData<unknown>(
    { queryKey: paymentKeys.all, predicate: (q) => estListePaginee(q.queryKey) },
    (old: unknown) => {
      if (!old || typeof old !== "object") return old

      const accumulee = old as { pages?: PaginatedResponse<Payment>[] }
      if (Array.isArray(accumulee.pages)) {
        return {
          ...accumulee,
          pages: accumulee.pages.map((page) => ({
            ...page,
            items: page.items.map(remplace),
          })),
        }
      }

      const page = old as PaginatedResponse<Payment>
      if (!Array.isArray(page.items)) return old
      return { ...page, items: page.items.map(remplace) }
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


/**
 * Le journal des versements, charge au fil du defilement.
 *
 * La pagination existait a l'ecran sans etre navigable : le pied de page
 * annoncait « Page 1/92 » et rien ne permettait d'atteindre la seconde.
 */
export function useInfinitePayments(params: PaymentListParams = {}) {
  return useInfiniteQuery({
    queryKey: [...paymentKeys.list(params), "infinite"] as const,
    queryFn: ({ pageParam }: { pageParam: number }) => paymentsApi.list({ ...params, page: pageParam }),
    initialPageParam: 1,
    // La condition d arret vit dans `./pagination`, ou elle est testee.
    getNextPageParam: (derniere: PaginatedResponse<Payment>, pages: unknown[]) =>
      pageSuivante(derniere, pages.length),
    // Sans année, le premier aller-retour additionnerait tous les exercices
    // et le bandeau clignoterait un collecté gonflé le temps que l'année arrive.
    enabled: params.academic_year_id != null,
    staleTime: 1000 * 60 * 5,
  })
}