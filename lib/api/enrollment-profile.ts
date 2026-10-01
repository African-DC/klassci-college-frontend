import { EnrollmentSchema, type Enrollment } from "@/lib/contracts/enrollment"
import {
  ProfileBatchResultSchema,
  ScholarshipSchema,
  type EnrollmentProfile,
  type ProfileBatchItem,
  type ProfileBatchResult,
  type Scholarship,
  type ScholarshipInput,
} from "@/lib/contracts/enrollment-profile"
import { apiFetch, safeValidate } from "./client"

/** Taille maximale d'un lot accepté par le serveur. */
export const PROFILE_BATCH_MAX = 100

/**
 * Les renseignements de la fiche et la bourse d'une inscription.
 *
 * Un `null` envoyé efface la valeur ; une clé absente la laisse telle quelle.
 * Les appelants n'envoient donc que ce qui a changé.
 */
export const enrollmentProfileApi = {
  update: async (
    enrollmentId: number,
    changes: Partial<EnrollmentProfile>,
  ): Promise<Enrollment> => {
    const json = await apiFetch<unknown>(`/enrollments/${enrollmentId}/profile`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    })
    return safeValidate(EnrollmentSchema, json, `PATCH /enrollments/${enrollmentId}/profile`)
  },

  /**
   * Tout ou rien côté serveur : un refus annule le lot entier et nomme
   * l'inscription fautive. Au-delà de 100 lignes, on découpe ici.
   */
  updateBatch: async (items: ProfileBatchItem[]): Promise<ProfileBatchResult> => {
    let updated = 0
    for (let i = 0; i < items.length; i += PROFILE_BATCH_MAX) {
      const json = await apiFetch<unknown>("/enrollments/profiles/batch", {
        method: "PATCH",
        body: JSON.stringify({ items: items.slice(i, i + PROFILE_BATCH_MAX) }),
      })
      updated += safeValidate(ProfileBatchResultSchema, json, "PATCH /enrollments/profiles/batch")
        .updated
    }
    return { updated }
  },

  setScholarship: async (enrollmentId: number, input: ScholarshipInput): Promise<Scholarship> => {
    const json = await apiFetch<unknown>(`/enrollments/${enrollmentId}/scholarship`, {
      method: "PUT",
      body: JSON.stringify(input),
    })
    return safeValidate(ScholarshipSchema, json, `PUT /enrollments/${enrollmentId}/scholarship`)
  },

  /** 204 sans corps : rien à valider. */
  removeScholarship: async (enrollmentId: number): Promise<void> => {
    await apiFetch<unknown>(`/enrollments/${enrollmentId}/scholarship`, { method: "DELETE" })
  },
}
