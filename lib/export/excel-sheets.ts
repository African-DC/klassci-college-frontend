/**
 * Classeurs à plusieurs feuilles : une feuille par classe, même en-tête.
 */

import { downloadBlob } from "@/lib/utils"
import { addSheet, newWorkbook, XLSX_MIME } from "./excel"
import { withLogo } from "./logo"
import type { ExportPayload } from "./types"

export interface WorkbookSheet {
  /** Nom souhaité ; `worksheetName` le rend acceptable par Excel. */
  name: string
  payload: ExportPayload
}

/** Caractères qu'Excel refuse dans un nom de feuille. */
const FORBIDDEN = /[\\/?*[\]:]/g
const MAX_LENGTH = 31

/**
 * Un nom de feuille qu'Excel accepte et qui ne double aucun autre.
 *
 * Excel refuse `\ / ? * [ ] :`, plus de 31 caractères, un nom vide, une
 * apostrophe en tête ou en fin, et deux feuilles de même nom (sans tenir
 * compte de la casse). « 6ème 1 » passe tel quel ; deux classes que la coupe
 * à 31 caractères rendrait identiques reçoivent « (2) », « (3) ».
 */
export function worksheetName(name: string, used: Set<string>): string {
  const clean =
    name
      .replace(FORBIDDEN, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^'+|'+$/g, "")
      .slice(0, MAX_LENGTH)
      .trim() || "Feuille"
  let candidate = clean
  for (let n = 2; used.has(candidate.toLowerCase()); n += 1) {
    const suffix = ` (${n})`
    candidate = `${clean.slice(0, MAX_LENGTH - suffix.length).trim()}${suffix}`
  }
  used.add(candidate.toLowerCase())
  return candidate
}

/** Génère puis télécharge un classeur à plusieurs feuilles. */
export async function exportSheetsToExcel(sheets: WorkbookSheet[], filename: string): Promise<void> {
  if (sheets.length === 0) throw new Error("Aucune feuille à exporter.")
  // Le logo ne se charge qu'une fois : toutes les feuilles portent la même marque.
  const branding = await withLogo(sheets[0].payload.branding)
  const wb = newWorkbook(branding.schoolName)
  const used = new Set<string>()
  for (const sheet of sheets) {
    addSheet(wb, { ...sheet.payload, branding }, worksheetName(sheet.name, used))
  }
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: XLSX_MIME })
  downloadBlob(blob, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`)
}
