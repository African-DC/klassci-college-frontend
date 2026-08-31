import { z } from "zod"
import {
  BulkValidateResultSchema,
  EnrollmentSchema,
  FeeRegenerationResultSchema,
  FeeVariantOptionSchema,
} from "@/lib/contracts/enrollment"
import type { BulkValidateResult, Enrollment, EnrollmentCreate, EnrollmentUpdate, FeeRegenerationResult, FeeVariantOption, NewEnrollment, ReEnrollment } from "@/lib/contracts/enrollment"
import { createCrudApi } from "./createCrudApi"
import { apiFetch, safeValidate } from "./client"

const FeeVariantOptionListSchema = z.array(FeeVariantOptionSchema)

export const enrollmentsApi = {
  ...createCrudApi<Enrollment, EnrollmentCreate, EnrollmentUpdate>(
    "/enrollments",
    EnrollmentSchema,
  ),

  createWithStudent: async (data: NewEnrollment) => {
    const { type, ...payload } = data
    const res = await apiFetch<unknown>("/enrollments/with-student", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return safeValidate(EnrollmentSchema, res, "POST /enrollments/with-student")
  },

  reEnroll: async (data: ReEnrollment) => {
    const { type, ...payload } = data
    const res = await apiFetch<unknown>("/enrollments/re-enroll", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return safeValidate(EnrollmentSchema, res, "POST /enrollments/re-enroll")
  },

  getFeeVariants: async (classId: number): Promise<FeeVariantOption[]> => {
    const res = await apiFetch<unknown>(`/enrollments/fee-variants?class_id=${classId}`)
    return safeValidate(
      FeeVariantOptionListSchema,
      res,
      `GET /enrollments/fee-variants?class_id=${classId}`,
    )
  },

  validate: async (id: number) => {
    return apiFetch<Enrollment>(`/enrollments/${id}/validate`, { method: "POST" })
  },

  /**
   * Refabrique les frais d'une inscription à partir des tarifs en vigueur.
   *
   * Le serveur remplace les lignes qui ne portent aucun versement et conserve
   * les autres : c'est lui qui compte, et sa phrase s'affiche telle quelle.
   */
  regenerateFees: async (enrollmentId: number): Promise<FeeRegenerationResult> => {
    const json = await apiFetch<unknown>(`/admin/enrollments/${enrollmentId}/regenerate-fees`, {
      method: "POST",
    })
    return safeValidate(
      FeeRegenerationResultSchema,
      json,
      `POST /admin/enrollments/${enrollmentId}/regenerate-fees`,
    )
  },

  depositInKind: async (enrollmentId: number, feeId: number) => {
    return apiFetch(`/enrollments/${enrollmentId}/fees/${feeId}/in-kind-deposit`, {
      method: "PATCH",
    })
  },

  /** Valide une liste d'inscriptions ; un refus n'arrete pas les autres. */
  bulkValidate: async (ids: number[]): Promise<BulkValidateResult> => {
    const res = await apiFetch<unknown>("/enrollments/bulk-validate", {
      method: "POST",
      body: JSON.stringify({ enrollment_ids: ids }),
    })
    return safeValidate(BulkValidateResultSchema, res, "POST /enrollments/bulk-validate")
  },
}
