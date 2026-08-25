import {
  DocumentReleaseStatusSchema,
  type DocumentReleaseStatus,
} from "@/lib/contracts/document-release"
import { apiFetch, safeValidate } from "./client"

export const documentReleaseApi = {
  /** Dit si les documents de cet élève sortiraient, et sinon de combien. */
  status: async (studentId: number): Promise<DocumentReleaseStatus> => {
    const json = await apiFetch<unknown>(`/students/${studentId}/documents/release-status`)
    return safeValidate(
      DocumentReleaseStatusSchema,
      json,
      `GET /students/${studentId}/documents/release-status`,
    )
  },
}
