import type { SchoolSettings } from "@/lib/contracts/settings"
import type { InformationSheetClass, InformationSheetRow } from "@/lib/contracts/information-sheet"
import {
  ARTISTIC_DISCIPLINES,
  LV2_OPTIONS,
  optionLabel,
  previousLevelLabel,
  repeaterLabel,
} from "@/lib/contracts/enrollment-profile"
import { brandingFromSettings } from "@/lib/export/branding"
import type { ExportColumn, ExportPayload } from "@/lib/export/types"

/**
 * Les seize colonnes de la fiche, dans l'ordre exact que la comptabilité recopie.
 *
 * Tout en texte : « 04 » doit rester « 04 », et une cellule vide doit rester
 * vide pour que l'école la complète à la main.
 */
export const INFORMATION_SHEET_COLUMNS: ExportColumn[] = [
  { key: "matricule", header: "MATRICULE", width: 14 },
  { key: "nom", header: "NOM", width: 18 },
  { key: "prenoms", header: "PRÉNOMS", width: 22 },
  { key: "sexe", header: "SEXE", width: 7, align: "center" },
  { key: "niveau", header: "NIVEAU", width: 10 },
  { key: "jour", header: "JOUR DE NAIS.", width: 9, align: "center" },
  { key: "mois", header: "MOIS DE NAIS.", width: 9, align: "center" },
  { key: "annee", header: "ANNÉE DE NAIS.", width: 10, align: "center" },
  { key: "lieu", header: "LIEU DE NAIS.", width: 18 },
  { key: "statut", header: "STATUT", width: 13 },
  { key: "regime", header: "RÉGIME", width: 13 },
  { key: "qualite", header: "QUALITÉ", width: 15 },
  { key: "lv2", header: "LV2", width: 10 },
  { key: "art", header: "DISCIPLINE ARTISTIQUE", width: 18 },
  { key: "photo", header: "PHOTO", width: 7, align: "center" },
  { key: "niveau_anterieur", header: "NIVEAU ANTÉRIEUR", width: 14 },
]

const STATUTS: Record<string, string> = {
  affecte: "Affecté",
  reaffecte: "Réaffecté",
  non_affecte: "Non affecté",
}

/**
 * « 2013-04-02 » en jour, mois et année, sur deux chiffres pour le jour et le
 * mois. On lit la chaîne, jamais un `Date` : un fuseau horaire décalerait le
 * 2 avril au 1er.
 */
export function splitBirthDate(value: string | null): { jour: string; mois: string; annee: string } {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? "")
  if (!match) return { jour: "", mois: "", annee: "" }
  return { jour: match[3], mois: match[2], annee: match[1] }
}

/** Une ligne de la fiche. Tout ce qui n'est pas renseigné sort en cellule vide. */
export function informationSheetRow(row: InformationSheetRow): Record<string, string> {
  return {
    matricule: row.matricule ?? "",
    nom: row.last_name,
    prenoms: row.first_name,
    sexe: row.genre ?? "",
    niveau: row.level_name ?? "",
    ...splitBirthDate(row.birth_date),
    lieu: row.birth_place ?? "",
    statut: row.assignment_status ? STATUTS[row.assignment_status] : "",
    // Une bourse, quelle qu'elle soit, fait le boursier. Sans bourse déclarée,
    // l'élève est non boursier : c'est la bourse qui s'enregistre, pas son absence.
    regime: row.scholarship_kind ? "Boursier" : "Non boursier",
    qualite: repeaterLabel(row.is_repeater),
    lv2: optionLabel(LV2_OPTIONS, row.lv2),
    art: optionLabel(ARTISTIC_DISCIPLINES, row.artistic_discipline),
    photo: row.has_photo ? "Oui" : "Non",
    niveau_anterieur: previousLevelLabel(row.previous_level, row.previous_series),
  }
}

export function buildInformationSheetPayload(
  classe: InformationSheetClass,
  academicYearName: string,
  settings: SchoolSettings | undefined,
): ExportPayload {
  const n = classe.rows.length
  return {
    branding: brandingFromSettings(settings),
    meta: {
      title: `Fiche de renseignements · ${classe.name}`,
      subtitle: `Année scolaire ${academicYearName} · ${n} élève${n > 1 ? "s" : ""}`,
      date: new Date().toLocaleDateString("fr-FR"),
    },
    columns: INFORMATION_SHEET_COLUMNS,
    rows: classe.rows.map(informationSheetRow),
    landscape: true,
  }
}

/** « Fiche de renseignements - 6ème 1 - 2026-2027.xlsx », sans caractère interdit. */
export function informationSheetFileName(parts: string[]): string {
  const name = ["Fiche de renseignements", ...parts]
    .map((p) => p.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" - ")
  return `${name}.xlsx`
}
