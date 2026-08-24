import {
  EnrollmentScheduleSchema,
  FeeInstallmentSchema,
  type EnrollmentSchedule,
  type FeeInstallment,
  type InstallmentDraft,
} from "@/lib/contracts/installment"
import { apiFetch, safeValidate } from "./client"
import { z } from "zod"

const FeeInstallmentArraySchema = z.array(FeeInstallmentSchema)

export const installmentsApi = {
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
