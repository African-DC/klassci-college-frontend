import { z } from "zod"
import {
  BulkValidateResultSchema,
  EnrollmentSchema,
  FeeRegenerationResultSchema,
  FeeVariantOptionSchema,
  NewStudentSuggestionSchema,
} from "@/lib/contracts/enrollment"
import type { BulkValidateResult, Enrollment, EnrollmentCreate, EnrollmentUpdate, FeeRegenerationResult, FeeVariantOption, NewEnrollment, NewStudentSuggestion, ReEnrollment } from "@/lib/contracts/enrollment"
import { createCrudApi } from "./createCrudApi"
import { apiFetch, safeValidate } from "./client"

const FeeVariantOptionListSchema = z.array(FeeVariantOptionSchema)

/**
 * `undefined` ne doit jamais quitter le frontend sur ce champ.
 *
 * `JSON.stringify` supprime les clés `undefined` : le champ disparaîtrait du
 * corps, et le serveur déduirait le profil alors que l'écran promettait de ne
 * rien affirmer. `null` part explicitement et dit « personne n'a tranché ».
 */
function withExplicitProfile<T extends { is_new_student?: boolean | null }>(payload: T) {
  return { ...payload, is_new_student: payload.is_new_student ?? null }
}

export const enrollmentsApi = {
  ...createCrudApi<Enrollment, EnrollmentCreate, EnrollmentUpdate>(
    "/enrollments",
    EnrollmentSchema,
  ),

  /**
   * Ce que la case « nouvel élève » doit afficher avant que le guichet ne tranche.
   *
   * Rend `suggested: null` tant que l'établissement n'a pas déclaré son
   * historique exploitable : l'écran n'a alors rien à pré-cocher et doit le
   * dire. L'endpoint vit avec les inscriptions et non sous `/admin` : son
   * sujet est l'inscription, et sa permission est `enrollments:create`.
   */
  newStudentSuggestion: async (
    studentId: number,
    academicYearId: number,
  ): Promise<NewStudentSuggestion> => {
    const path = `/enrollments/new-student-suggestion?student_id=${studentId}&academic_year_id=${academicYearId}`
    const data = await apiFetch<unknown>(path)
    return safeValidate(
      NewStudentSuggestionSchema,
      data,
      "GET /enrollments/new-student-suggestion",
    )
  },

  createWithStudent: async (data: NewEnrollment) => {
    const { type, ...payload } = data
    const res = await apiFetch<unknown>("/enrollments/with-student", {
      method: "POST",
      body: JSON.stringify(withExplicitProfile(payload)),
    })
    return safeValidate(EnrollmentSchema, res, "POST /enrollments/with-student")
  },

  reEnroll: async (data: ReEnrollment) => {
    const { type, ...payload } = data
    const res = await apiFetch<unknown>("/enrollments/re-enroll", {
      method: "POST",
      body: JSON.stringify(withExplicitProfile(payload)),
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
