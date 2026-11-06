import {
  EnrollmentScheduleSchema,
  FeeInstallmentSchema,
  type EnrollmentSchedule,
  type FeeInstallment,
  type InstallmentDraft,
} from "@/lib/contracts/installment"
import { apiFetch, apiFetchBlob, safeValidate } from "./client"
import {
  ScheduleOverviewResponseSchema,
  type ScheduleOverviewResponse,
  type ScheduleOverviewParams,
} from "@/lib/contracts/installment-overview"
import { z } from "zod"

const FeeInstallmentArraySchema = z.array(FeeInstallmentSchema)


function overviewQuery(
  filters: ScheduleOverviewParams & { format?: "pdf" | "xlsx" },
): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value))
  }
  return `?${params.toString()}`
}

export const installmentsApi = {

  /** Suivi consolidé : autorisé exclusivement par payments:read:all côté API. */
  overview: async (filters: ScheduleOverviewParams): Promise<ScheduleOverviewResponse> => {
    const path = `/admin/fee-installments/schedules${overviewQuery(filters)}`
    const json = await apiFetch<unknown>(path)
    return safeValidate(ScheduleOverviewResponseSchema, json, "GET /admin/fee-installments/schedules")
  },

  /** L'export serveur porte sur TOUTES les lignes filtrées, pas la page seule. */
  exportOverview: async (
    filters: Omit<ScheduleOverviewParams, "page" | "size">,
    format: "pdf" | "xlsx",
  ): Promise<Blob> => {
    return apiFetchBlob(
      `/admin/fee-installments/schedules/export${overviewQuery({ ...filters, format })}`,
    )
  },

  /** Grille de tranches d'une année scolaire. */
  grid: async (academicYearId: number): Promise<FeeInstallment[]> => {
    const json = await apiFetch<unknown>(`/admin/fee-installments?academic_year_id=${academicYearId}`)
    return safeValidate(FeeInstallmentArraySchema, json, "GET /admin/fee-installments")
  },

  /** Remplacement intégral : la somme des pourcentages doit faire 100 %. */
  replaceGrid: async (
    academicYearId: number,
    installments: InstallmentDraft[],
  ): Promise<FeeInstallment[]> => {
    const json = await apiFetch<unknown>(
      `/admin/fee-installments?academic_year_id=${academicYearId}`,
      { method: "PUT", body: JSON.stringify({ installments }) },
    )
    return safeValidate(FeeInstallmentArraySchema, json, "PUT /admin/fee-installments")
  },

  /** Échéancier applicable à une inscription, avec son état de retard. */
  schedule: async (enrollmentId: number): Promise<EnrollmentSchedule> => {
    const json = await apiFetch<unknown>(`/enrollments/${enrollmentId}/schedule`)
    return safeValidate(EnrollmentScheduleSchema, json, "GET /enrollments/{id}/schedule")
  },
}
