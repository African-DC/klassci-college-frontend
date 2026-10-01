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

/**
 * Un lot refusé, avec ce qui était déjà enregistré avant lui.
 *
 * `updated` compte les lignes des lots précédents, déjà en base ; `chunk` est
 * le lot refusé, dont aucune ligne n'est partie (tout ou rien côté serveur).
 * `reason` garde l'erreur d'origine et son `detail`.
 */
export class ProfileBatchError extends Error {
  constructor(
    readonly reason: unknown,
    readonly updated: number,
    readonly chunk: ProfileBatchItem[],
  ) {
    super(reason instanceof Error ? reason.message : "Enregistrement refusé")
    this.name = "ProfileBatchError"
  }
}

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
   * Tout ou rien côté serveur, mais par lot de 100 : au-delà, on découpe ici.
   * Si un lot est refusé, les précédents restent enregistrés, et l'erreur le
   * dit (`ProfileBatchError.updated`) au lieu de prétendre que rien n'est parti.
   */
  updateBatch: async (items: ProfileBatchItem[]): Promise<ProfileBatchResult> => {
    let updated = 0
    for (let i = 0; i < items.length; i += PROFILE_BATCH_MAX) {
      const chunk = items.slice(i, i + PROFILE_BATCH_MAX)
      let json: unknown
      try {
        json = await apiFetch<unknown>("/enrollments/profiles/batch", {
          method: "PATCH",
          body: JSON.stringify({ items: chunk }),
        })
      } catch (cause) {
        throw new ProfileBatchError(cause, updated, chunk)
      }
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
