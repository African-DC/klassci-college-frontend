import type { Student } from "@/lib/contracts/student"
import type { SchoolSettings } from "@/lib/contracts/settings"
import type { ExportPayload } from "@/lib/export"
import { brandingFromSettings } from "@/lib/export/branding"

const SEX_LABELS: Record<string, string> = { M: "Masculin", F: "Féminin" }

interface StudentsExportArgs {
  students: Student[]
  settings: SchoolSettings | undefined
  /** Résumé lisible des filtres actifs (chip cohorte, recherche). */
  filters?: string
}

/**
 * Construit la charge utile d'export de la liste des élèves telle qu'affichée
 * (page courante, filtres appliqués). Colonnes calquées sur le tableau admin :
 * matricule, nom, sexe, naissance, classe, statut.
 */
export function buildStudentsExportPayload({
  students,
  settings,
  filters,
}: StudentsExportArgs): ExportPayload {
  return {
    branding: brandingFromSettings(settings),
    meta: {
      title: "Liste des élèves",
      subtitle: `${students.length} élève(s) affiché(s)`,
      filters,
      date: new Date().toLocaleDateString("fr-FR"),
    },
    columns: [
      { key: "matricule", header: "Matricule" },
      { key: "nom", header: "Nom" },
      { key: "sexe", header: "Sexe" },
      { key: "naissance", header: "Naissance", format: "date" },
      { key: "classe", header: "Classe" },
      { key: "statut", header: "Statut" },
    ],
    rows: students.map((s) => ({
      matricule: s.enrollment_number ?? "",
      nom: `${s.last_name} ${s.first_name}`.trim(),
      sexe: s.genre ? (SEX_LABELS[s.genre] ?? s.genre) : "",
      naissance: s.birth_date ?? "",
      classe: s.current_enrollment?.class_name ?? "À inscrire",
      statut: s.current_enrollment?.status ?? "Non inscrit",
    })),
  }
}
