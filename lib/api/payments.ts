import { z } from "zod"
import { apiFetch, safeValidate } from "./client"
import {
  PaymentSchema,
  FinancialSummarySchema,
  type Payment,
  type PaymentCreate,
  type PaymentListParams,
  type FinancialSummary,
} from "@/lib/contracts/payment"
import { PaginatedResponseSchema, type PaginatedResponse } from "@/lib/contracts"

const PaginatedPaymentSchema = PaginatedResponseSchema(PaymentSchema)
const PaymentArraySchema = z.array(PaymentSchema)

export const paymentsApi = {
  // Liste paginée des paiements
  list: async (params: PaymentListParams = {}): Promise<PaginatedResponse<Payment>> => {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString()
    const json = await apiFetch<PaginatedResponse<Payment> | Payment[]>(
      `/payments${query ? `?${query}` : ""}`,
    )
    if (Array.isArray(json)) {
      const arr = safeValidate(PaymentArraySchema, json, "GET /payments")
      return { data: arr, total: arr.length, page: 1, per_page: arr.length, total_pages: 1 }
    }
    return safeValidate(PaginatedPaymentSchema, json, "GET /payments")
  },

  // Créer un paiement
  create: async (data: PaymentCreate): Promise<Payment> => {
    const json = await apiFetch<{ data?: Payment } | Payment>("/payments", {
      method: "POST",
      body: JSON.stringify(data),
    })
    const payment = (json as { data?: Payment }).data ?? (json as Payment)
    return safeValidate(PaymentSchema, payment, "POST /payments")
  },

  // Valider un paiement
  validate: async (id: number): Promise<Payment> => {
    const json = await apiFetch<{ data?: Payment } | Payment>(`/payments/${id}/validate`, {
      method: "POST",
    })
    const payment = (json as { data?: Payment }).data ?? (json as Payment)
    return safeValidate(PaymentSchema, payment, `POST /payments/${id}/validate`)
  },

  // Annuler un paiement
  cancel: async (id: number): Promise<Payment> => {
    const json = await apiFetch<{ data?: Payment } | Payment>(`/payments/${id}/cancel`, {
      method: "POST",
    })
    const payment = (json as { data?: Payment }).data ?? (json as Payment)
    return safeValidate(PaymentSchema, payment, `POST /payments/${id}/cancel`)
  },

  // Résumé financier
  getSummary: async (academicYearId?: number): Promise<FinancialSummary> => {
    const query = academicYearId ? `?academic_year_id=${academicYearId}` : ""
    const json = await apiFetch<{ data?: FinancialSummary } | FinancialSummary>(
      `/payments/summary${query}`,
    )
    const summary = (json as { data?: FinancialSummary }).data ?? (json as FinancialSummary)
    return safeValidate(FinancialSummarySchema, summary, "GET /payments/summary")
  },

  // Télécharger le reçu PDF
  downloadReceipt: async (id: number): Promise<Blob> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not defined")
    const res = await fetch(`${baseUrl}/payments/${id}/receipt`)
    if (!res.ok) throw new Error("Impossible de télécharger le reçu")
    return res.blob()
  },
}
