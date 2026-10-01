/**
 * Classeurs à plusieurs feuilles : une feuille par classe, même en-tête.
 */

import { downloadBlob } from "@/lib/utils"
import { addSheet, newWorkbook, XLSX_MIME } from "./excel"
import { withLogo } from "./logo"
import { worksheetName } from "./sheet-name"
import type { ExportPayload } from "./types"

export { worksheetName }

export interface WorkbookSheet {
  /** Nom souhaité ; `worksheetName` le rend acceptable par Excel. */
  name: string
  payload: ExportPayload
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
