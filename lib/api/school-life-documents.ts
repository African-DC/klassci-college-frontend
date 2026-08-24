import { apiFetchBlob } from "./client"
import type { EntrySlipRequest } from "@/lib/contracts/school-life"

/**
 * Actes de vie scolaire sans registre : la demande de dossier scolaire et le
 * billet d'entrée. Les deux autres actes (convocation, annulation de zéro)
 * ont leur propre client parce qu'ils ont un registre à consulter.
 */
export const schoolLifeDocumentsApi = {
  /** Courrier réclamant le dossier d'un élève à son établissement d'origine. */
  downloadSchoolFileRequest: (studentId: number): Promise<Blob> =>
    apiFetchBlob(`/school-life/students/${studentId}/documents/demande-dossier-scolaire.pdf`),

  /**
   * Délivre le billet d'entrée. POST et non GET : l'appel bascule l'absence
   * visée en « excusé » dans le cahier d'appel avant de rendre le PDF, donc
   * l'appelant doit invalider les requêtes de présence après succès.
   */
  issueEntrySlip: (recordId: number, payload: EntrySlipRequest): Promise<Blob> =>
    apiFetchBlob(`/school-life/attendance-records/${recordId}/entry-slip.pdf`, {
      method: "POST",
      body: JSON.stringify({
        resume_date: payload.resume_date,
        notes: payload.notes?.trim() ? payload.notes.trim() : null,
      }),
    }),
}
