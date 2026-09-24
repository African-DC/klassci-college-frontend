import type { PaginatedResponse } from "@/lib/contracts"
import type { Student } from "@/lib/contracts/student"
import type { SchoolSettings } from "@/lib/contracts/settings"
import type { ExportPayload } from "@/lib/export"
import { brandingFromSettings } from "@/lib/export/branding"
import { fetchAllPages } from "@/lib/api/fetch-all-pages"
import { studentsApi } from "@/lib/api/students"
import { enrollmentStatusView } from "@/lib/enrollment/status"

const SEX_LABELS: Record<string, string> = { M: "Masculin", F: "Féminin" }

interface StudentsExportArgs {
  students: Student[]
  settings: SchoolSettings | undefined
  /** Résumé lisible des filtres actifs (chip cohorte, recherche). */
  filters?: string
}

/**
 * Construit la charge utile d'export d'une liste d'élèves. Colonnes calquées
 * sur le tableau admin : matricule, nom, sexe, naissance, classe, statut.
 */
export function buildStudentsExportPayload({
  students,
  settings,
  filters,
}: StudentsExportArgs): ExportPayload {
  const count = students.length
  return {
    branding: brandingFromSettings(settings),
    meta: {
      title: "Liste des élèves",
      subtitle: `${count} élève${count > 1 ? "s" : ""}`,
      filters,
      date: new Date().toLocaleDateString("fr-FR"),
    },
    columns: [
      { key: "matricule", header: "Matricule" },
      { key: "nom", header: "Nom" },
      { key: "sexe", header: "Sexe" },
      { key: "naissance", header: "Naissance", format: "date" },
      { key: "lieu_naissance", header: "Lieu de naissance" },
      { key: "classe", header: "Classe" },
      { key: "statut", header: "Statut" },
    ],
    rows: students.map((s) => ({
      matricule: s.enrollment_number ?? "",
      nom: `${s.last_name} ${s.first_name}`.trim(),
      sexe: s.genre ? (SEX_LABELS[s.genre] ?? s.genre) : "",
      naissance: s.birth_date ?? "",
      lieu_naissance: s.birth_place ?? "",
      classe: s.current_enrollment?.class_name ?? "À inscrire",
      statut: s.current_enrollment
        ? enrollmentStatusView(s.current_enrollment.status).label
        : "Non inscrit",
    })),
  }
}

interface LoadStudentsExportArgs {
  /** Mêmes filtres que la liste affichée (classe, recherche, « À inscrire »). */
  params: Record<string, unknown>
  settings: SchoolSettings | undefined
  filters?: string
  /** Source des pages, remplaçable en test. */
  list?: (params: Record<string, unknown>) => Promise<PaginatedResponse<Student>>
}

/**
 * Charge TOUS les élèves correspondant aux filtres avant de construire
 * l'export. L'écran ne détient que les pages déjà défilées : exporter ces
 * lignes-là donnait 20 élèves pour une classe qui en compte 45.
 */
export async function loadStudentsExportPayload({
  params,
  settings,
  filters,
  list = studentsApi.list,
}: LoadStudentsExportArgs): Promise<ExportPayload> {
  const students = await fetchAllPages(list, params)
  return buildStudentsExportPayload({ students, settings, filters })
}
