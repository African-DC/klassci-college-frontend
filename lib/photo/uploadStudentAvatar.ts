import { studentsApi } from "@/lib/api/students"

export type PhotoSaveOutcome = "none" | "saved" | "failed"

export async function uploadStudentAvatar(
  studentId: number | undefined,
  photo: File | null,
): Promise<PhotoSaveOutcome> {
  if (!photo) return "none"
  if (!studentId) return "failed"
  try {
    await studentsApi.uploadPhoto(studentId, photo)
    return "saved"
  } catch {
    return "failed"
  }
}

export function photoOutcomeMessage(outcome: PhotoSaveOutcome): string | null {
  if (outcome === "saved") return "Photo enregistrée sur le profil."
  if (outcome === "failed") {
    return "Fiche créée, mais la photo n'a pas pu être enregistrée. Réessayez depuis la fiche élève."
  }
  return null
}
