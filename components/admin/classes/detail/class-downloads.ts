import { rosterQuery, type RosterFilters } from "./roster-filters"
import { apiFetchBlob } from "@/lib/api/client"

/**
 * Téléchargements PDF d'une classe (liste / synthèse).
 *
 * Réutilise `apiFetchBlob` (Bearer token + contrat 401 → handleExpiredSession).
 * Exception légitime à la validation Zod (réponse binaire Blob), cf.
 * `.claude/rules/api-client-zod-validation.md`.
 */

/** Liste de classe (roster) — PDF. */
export function fetchClassRoster(classId: number, filters: RosterFilters = {}): Promise<Blob> {
  return apiFetchBlob(`/admin/classes/${classId}/roster${rosterQuery(filters)}`)
}

/** Liste nominative complète en Word éditable (.docx). */
export function fetchClassRosterWord(classId: number, filters: RosterFilters = {}): Promise<Blob> {
  return apiFetchBlob(`/admin/classes/${classId}/roster.docx${rosterQuery(filters)}`)
}

/** Rapport de synthèse de la classe pour un trimestre — PDF. */
export function fetchClassSynthesis(
  classId: number,
  trimester: number,
  academicYearId: number,
): Promise<Blob> {
  return apiFetchBlob(
    `/reports/classes/${classId}/synthesis?trimester=${trimester}&academic_year_id=${academicYearId}`,
  )
}

/** Feuille d'appel (présences vierges à cocher) de la classe — PDF. */
export function fetchClassAttendanceSheet(classId: number): Promise<Blob> {
  return apiFetchBlob(`/admin/classes/${classId}/attendance-sheet`)
}

/** Orientation du document A4 (indépendante de la taille de l\'écran). */
export type GradeSheetOrientation = "landscape" | "portrait"

/** Feuille de notes vierge : l\'aperçu et le téléchargement utilisent le même format. */
export function fetchClassGradeSheet(
  classId: number,
  orientation: GradeSheetOrientation = "landscape",
): Promise<Blob> {
  return apiFetchBlob(`/admin/classes/${classId}/grade-sheet?orientation=${orientation}`)
}

/** Cahier de texte de la classe (semaine en cours par défaut) — PDF. */
export function fetchClassCahierTexte(classId: number): Promise<Blob> {
  return apiFetchBlob(`/admin/classes/${classId}/cahier-texte`)
}

/**
 * Déclenche le téléchargement d'un Blob côté navigateur (création d'un
 * `<a download>` éphémère + revokeObjectURL). Pattern identique à
 * PdfIdentitySection / PaymentsPageClient.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/** Nettoie un nom de classe pour un nom de fichier (espaces → tirets). */
export function fileSafeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
}

/** Excel provenant du même ensemble filtré que les documents PDF/Word. */
export function fetchClassRosterExcel(classId: number, filters: RosterFilters = {}): Promise<Blob> {
  return apiFetchBlob(`/admin/classes/${classId}/roster.xlsx${rosterQuery(filters)}`)
}
