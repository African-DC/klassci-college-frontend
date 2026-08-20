import { apiFetchBlob } from "./client"

/**
 * Le motif de dérogation voyage en query : ces endpoints sont des GET qui
 * renvoient un PDF, pas des mutations. Le backend refuse en 402 tant que le
 * motif manque ou que l'appelant n'a pas `documents:release:override`.
 */
function withOverride(path: string, overrideReason?: string): string {
  const reason = overrideReason?.trim()
  return reason ? `${path}?override_reason=${encodeURIComponent(reason)}` : path
}

/**
 * Documents officiels par eleve (certificat de scolarite, attestation
 * de frequentation). Le backend expose ces endpoints via le router
 * student_documents (#107, #109).
 */
export const studentDocumentsApi = {
  /** Telecharge le PDF du certificat de scolarite. */
  downloadCertificateScolarite: (studentId: number, overrideReason?: string): Promise<Blob> =>
    apiFetchBlob(
      withOverride(`/students/${studentId}/documents/certificat-scolarite.pdf`, overrideReason),
    ),

  /** Telecharge le PDF de l'attestation de frequentation (avec stats). */
  downloadAttestationFrequentation: (studentId: number, overrideReason?: string): Promise<Blob> =>
    apiFetchBlob(
      withOverride(`/students/${studentId}/documents/attestation-frequentation.pdf`, overrideReason),
    ),
}
