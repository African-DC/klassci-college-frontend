import type { SchoolSettings } from "@/lib/contracts/settings"
import type { ClassRosterData } from "@/lib/contracts/class-roster"
import type { ExportPayload } from "@/lib/export"
import { brandingFromSettings } from "@/lib/export/branding"

/** PDF, Word et Excel prennent exactement les mêmes élèves de l'API roster. */
export function buildClassRosterExcel(roster: ClassRosterData, settings: SchoolSettings | undefined, selection?: string): ExportPayload {
  return {
    branding: brandingFromSettings(settings),
    meta: { title: `Liste de classe · ${roster.class_name}`,
      subtitle: `${roster.total} élève${roster.total > 1 ? "s" : ""} · ${roster.academic_year_name}`,
      filters: selection ?? `Classe ${roster.class_name}`, date: new Date().toLocaleDateString("fr-FR") },
    columns: [
      { key: "matricule", header: "Matricule" }, { key: "nom", header: "Nom" },
      { key: "prenoms", header: "Prénoms" }, { key: "sexe", header: "Sexe" },
      { key: "naissance", header: "Naissance", format: "date" }, { key: "lieu", header: "Lieu de naissance" },
      { key: "nationalite", header: "Nationalité" }, { key: "qualite", header: "Qualité" },
      { key: "affectation", header: "Affectation" }, { key: "profil", header: "Profil" },
      { key: "parent", header: "Téléphone parent urgence" },
    ],
    rows: roster.students.map(s => ({
      matricule: s.enrollment_number, nom: s.last_name, prenoms: s.first_name,
      sexe: s.genre === "M" ? "Masculin" : s.genre === "F" ? "Féminin" : "",
      naissance: s.birth_date ?? "", lieu: s.birth_place ?? "", nationalite: s.nationality ?? "",
      qualite: s.is_repeater == null ? "" : s.is_repeater ? "Redoublant" : "Non redoublant",
      affectation: s.assignment_status === "affecte" ? "Affecté" : s.assignment_status === "reaffecte" ? "Réaffecté" : s.assignment_status === "non_affecte" ? "Non affecté" : "",
      profil: s.is_new_student == null ? "" : s.is_new_student ? "Nouveau" : "Ancien",
      parent: s.parent_phone ?? "",
    })),
  }
}
