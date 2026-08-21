import { z } from "zod"
import { apiFetch, apiFetchBlob, safeValidate } from "./client"
import {
  AllocationPreviewSchema,
  CashierOptionSchema,
  FinancialSummarySchema,
  PaymentSchema,
  type AllocationPreview,
  type CashierOption,
  type EnrollmentPaymentCreate,
  type FinancialSummary,
  type Payment,
  type PaymentCreate,
  type PaymentListParams,
} from "@/lib/contracts/payment"
import { PaginatedResponseSchema, type PaginatedResponse } from "@/lib/contracts"

const PaginatedPaymentSchema = PaginatedResponseSchema(PaymentSchema)
const PaymentArraySchema = z.array(PaymentSchema)
const CashierArraySchema = z.array(CashierOptionSchema)

/** Sérialise les filtres d'écran en query string, en ignorant les vides. */
function toQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([key, value]) => [key, String(value)]),
  ).toString()
  return query ? `?${query}` : ""
}

function unwrap(json: unknown): unknown {
  if (json !== null && typeof json === "object") {
    const obj = json as Record<string, unknown>
    if (obj.data !== undefined) return obj.data
    if (obj.items !== undefined) return obj.items
  }
  return json
}

function unwrapPayment(json: unknown): unknown {
  if (json !== null && typeof json === "object") {
    const obj = json as Record<string, unknown>
    if (obj.data !== undefined) return obj.data
  }
  return json
}

export const paymentsApi = {
  // Liste paginée des paiements
  list: async (params: PaymentListParams = {}): Promise<PaginatedResponse<Payment>> => {
    const json = await apiFetch<unknown>(`/payments${toQuery(params)}`)
    if (Array.isArray(json)) {
      const arr = safeValidate(PaymentArraySchema, json, "GET /payments")
      return { items: arr, total: arr.length, page: 1, size: arr.length, total_pages: 1 }
    }
    return safeValidate(
      PaginatedPaymentSchema,
      json,
      "GET /payments",
    ) as PaginatedResponse<Payment>
  },

  // LEGACY — Créer un paiement ciblant un frais spécifique
  // Préférer `recordOnEnrollment` (auto-allocation prioritaire).
  create: async (data: PaymentCreate): Promise<Payment> => {
    const json = await apiFetch<unknown>("/payments", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return safeValidate(PaymentSchema, unwrapPayment(json), "POST /payments")
  },

  // NEW — Versement caissier Wave-style (auto-alloué par priorité)
  recordOnEnrollment: async (
    enrollmentId: number,
    data: EnrollmentPaymentCreate,
  ): Promise<Payment> => {
    const json = await apiFetch<unknown>(`/enrollments/${enrollmentId}/payments`, {
      method: "POST",
      body: JSON.stringify(data),
    })
    return safeValidate(
      PaymentSchema,
      unwrapPayment(json),
      `POST /enrollments/${enrollmentId}/payments`,
    )
  },

  // NEW — Preview de l'allocation avant submit (read-only)
  previewAllocation: async (
    enrollmentId: number,
    amount: number,
  ): Promise<AllocationPreview> => {
    const json = await apiFetch<unknown>(
      `/enrollments/${enrollmentId}/payments/preview?amount=${amount}`,
    )
    return safeValidate(
      AllocationPreviewSchema,
      unwrap(json),
      `GET /enrollments/${enrollmentId}/payments/preview`,
    )
  },

  // NEW — Historique paiements d'une inscription (Payment.enrollment_id direct)
  listByEnrollment: async (enrollmentId: number): Promise<Payment[]> => {
    const json = await apiFetch<unknown>(`/enrollments/${enrollmentId}/payments`)
    const arr = Array.isArray(json) ? json : []
    return safeValidate(
      PaymentArraySchema,
      arr,
      `GET /enrollments/${enrollmentId}/payments`,
    )
  },

  // Récupérer un paiement par ID
  getById: async (id: number): Promise<Payment> => {
    const json = await apiFetch<unknown>(`/payments/${id}`)
    return safeValidate(PaymentSchema, unwrapPayment(json), `GET /payments/${id}`)
  },

  // LEGACY — paiements d'un élève via /payments/student/{enrollment_id}
  // Préférer `listByEnrollment` qui utilise le nouveau path REST nested.
  getStudentPayments: async (enrollmentId: number): Promise<Payment[]> => {
    const json = await apiFetch<unknown>(`/payments/student/${enrollmentId}`)
    const arr = Array.isArray(json) ? json : []
    return safeValidate(
      PaymentArraySchema,
      arr,
      `GET /payments/student/${enrollmentId}`,
    )
  },

  // Valider un paiement (pending → completed)
  validate: async (id: number): Promise<Payment> => {
    const json = await apiFetch<unknown>(`/payments/${id}/validate`, { method: "POST" })
    return safeValidate(
      PaymentSchema,
      unwrapPayment(json),
      `POST /payments/${id}/validate`,
    )
  },

  // Annuler un paiement (cascade DELETE allocations + recompute fees)
  cancel: async (id: number): Promise<Payment> => {
    const json = await apiFetch<unknown>(`/payments/${id}/cancel`, { method: "POST" })
    return safeValidate(
      PaymentSchema,
      unwrapPayment(json),
      `POST /payments/${id}/cancel`,
    )
  },

  // Résumé financier (KPIs dashboard)
  getSummary: async (academicYearId?: number): Promise<FinancialSummary> => {
    const query = academicYearId ? `?academic_year_id=${academicYearId}` : ""
    const json = await apiFetch<unknown>(`/payments/summary${query}`)
    return safeValidate(
      FinancialSummarySchema,
      unwrapPayment(json),
      "GET /payments/summary",
    )
  },

  // Télécharger le reçu PDF
  downloadReceipt: async (id: number): Promise<Blob> => {
    return apiFetchBlob(`/payments/${id}/receipt`)
  },

  // Les encaisseurs proposables dans le filtre « Encaissé par ».
  // Un caissier cloisonné ne reçoit que lui-même : le filtre ne peut de toute
  // façon rien lui montrer des autres guichets.
  listCashiers: async (): Promise<CashierOption[]> => {
    const json = await apiFetch<unknown>("/payments/cashiers")
    return safeValidate(CashierArraySchema, unwrap(json), "GET /payments/cashiers")
  },

  // Journal des versements, mêmes filtres que la liste affichée. Le
  // cloisonnement est appliqué par le serveur : l'export ne peut pas montrer
  // plus que l'écran.
  downloadJournal: (
    params: PaymentListParams = {},
    format: "pdf" | "xlsx" = "pdf",
  ): Promise<Blob> => {
    // La pagination reste à l'écran : un journal se lit en entier, et un
    // document qui ne couvrirait que la page affichée annoncerait un total
    // faux sans le dire.
    const filters: Record<string, string | number | undefined> = { format }
    for (const [key, value] of Object.entries(params)) {
      if (key !== "page" && key !== "size") filters[key] = value as string | number | undefined
    }
    return apiFetchBlob(`/payments/export${toQuery(filters)}`)
  },
}
