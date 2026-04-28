import { apiFetchBlob } from "./client"

/**
 * Documents officiels par eleve (certificat de scolarite, attestation
 * de frequentation). Le backend expose ces endpoints via le router
 * student_documents (#107, #109).
 */
export const studentDocumentsApi = {
  /** Telecharge le PDF du certificat de scolarite. */
  downloadCertificateScolarite: (studentId: number): Promise<Blob> =>
    apiFetchBlob(`/students/${studentId}/documents/certificat-scolarite.pdf`),

  /** Telecharge le PDF de l'attestation de frequentation (avec stats). */
  downloadAttestationFrequentation: (studentId: number): Promise<Blob> =>
    apiFetchBlob(`/students/${studentId}/documents/attestation-frequentation.pdf`),
}
