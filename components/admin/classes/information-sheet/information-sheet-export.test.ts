/**
 * La fiche de renseignements : seize colonnes dans l'ordre de la comptabilité,
 * et une cellule vide partout où l'école n'a encore rien saisi.
 */
import { describe, expect, it } from "vitest"
import type { InformationSheetRow } from "@/lib/contracts/information-sheet"
import { worksheetName } from "@/lib/export/excel-sheets"
import {
  INFORMATION_SHEET_COLUMNS,
  buildInformationSheetPayload,
  informationSheetFileName,
  informationSheetRow,
} from "./information-sheet-export"

const complete: InformationSheetRow = {
  enrollment_id: 42,
  matricule: "24-0012",
  last_name: "KONÉ",
  first_name: "Awa Mariam",
  genre: "F",
  level_name: "4ème",
  birth_date: "2012-04-02",
  birth_place: "Bouaké",
  nationality: "Ivoirienne",
  assignment_status: "reaffecte",
  scholarship_kind: "demi_bourse",
  is_repeater: true,
  lv2: "espagnol",
  artistic_discipline: "arts_plastiques",
  has_photo: true,
  previous_level: "2NDE",
  previous_series: "C",
}

const empty: InformationSheetRow = {
  ...complete,
  matricule: null,
  genre: null,
  level_name: null,
  birth_date: null,
  birth_place: null,
  nationality: null,
  assignment_status: null,
  scholarship_kind: null,
  is_repeater: null,
  lv2: null,
  artistic_discipline: null,
  has_photo: false,
  previous_level: null,
  previous_series: null,
}

/** La ligne lue dans l'ordre des colonnes, comme Excel l'écrira. */
function cells(row: InformationSheetRow): string[] {
  const mapped = informationSheetRow(row)
  return INFORMATION_SHEET_COLUMNS.map((c) => mapped[c.key])
}

describe("la fiche de renseignements en Excel", () => {
  it("garde exactement les seize colonnes, dans l'ordre demandé", () => {
    expect(INFORMATION_SHEET_COLUMNS.map((c) => c.header)).toEqual([
      "MATRICULE",
      "NOM",
      "PRÉNOMS",
      "SEXE",
      "NIVEAU",
      "JOUR DE NAIS.",
      "MOIS DE NAIS.",
      "ANNÉE DE NAIS.",
      "LIEU DE NAIS.",
      "STATUT",
      "RÉGIME",
      "QUALITÉ",
      "LV2",
      "DISCIPLINE ARTISTIQUE",
      "PHOTO",
      "NIVEAU ANTÉRIEUR",
    ])
  })

  it("écrit une ligne renseignée en toutes lettres, date découpée sur deux chiffres", () => {
    expect(cells(complete)).toEqual([
      "24-0012",
      "KONÉ",
      "Awa Mariam",
      "F",
      "4ème",
      "02",
      "04",
      "2012",
      "Bouaké",
      "Réaffecté",
      "Boursier",
      "Redoublant",
      "Espagnol",
      "Arts plastiques",
      "Oui",
      "2nde C",
    ])
  })

  it("laisse vide ce qui n'est pas renseigné, sans inventer de « Non »", () => {
    expect(cells(empty)).toEqual([
      "",
      "KONÉ",
      "Awa Mariam",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "Non boursier",
      "",
      "",
      "",
      "Non",
      "",
    ])
    expect(informationSheetRow({ ...empty, is_repeater: false }).qualite).toBe("Non redoublant")
    expect(informationSheetRow({ ...empty, assignment_status: "non_affecte" }).statut).toBe(
      "Non affecté",
    )
  })

  it("titre la feuille et le fichier au nom de la classe et de l'année", () => {
    const payload = buildInformationSheetPayload(
      { id: 3, name: "6ème 1", level_name: "6ème", rows: [complete, empty] },
      "2026-2027",
      undefined,
    )
    expect(payload.rows).toHaveLength(2)
    expect(payload.meta.title).toBe("Fiche de renseignements · 6ème 1")
    expect(informationSheetFileName(["6ème 1", "2026-2027"])).toBe(
      "Fiche de renseignements - 6ème 1 - 2026-2027.xlsx",
    )
    expect(informationSheetFileName(["Tle A/B", "2026-2027"])).toBe(
      "Fiche de renseignements - Tle A B - 2026-2027.xlsx",
    )
  })

  it("donne à chaque classe un nom de feuille qu'Excel accepte, sans doublon", () => {
    const used = new Set<string>()
    expect(worksheetName("6ème 1", used)).toBe("6ème 1")
    expect(worksheetName("Tle D [1]: sciences/expérimentales", used)).toBe(
      "Tle D 1 sciences expérimentales",
    )
    const long = "Terminale A littéraire option langues"
    const first = worksheetName(long, used)
    const second = worksheetName(long, used)
    expect(first.length).toBeLessThanOrEqual(31)
    expect(second.length).toBeLessThanOrEqual(31)
    expect(second).not.toBe(first)
    expect(second.endsWith("(2)")).toBe(true)
    expect(worksheetName("'''", used)).toBe("Feuille")
  })
})
