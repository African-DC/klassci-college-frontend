/**
 * Builder Excel (.xlsx) du socle d'export.
 *
 * Produit un classeur avec un bloc d'entête marqué (nom école, titre,
 * sous-titre, filtres/date) PUIS une vraie table exploitable : entête en
 * gras blanc sur fond primaire, autofiltre, volet figé, types corrects
 * (nombre / date / XOF via numFmt) et ligne total optionnelle.
 *
 * Aucune cellule fusionnée dans la zone de données (filtres et tableaux
 * croisés dynamiques doivent rester intacts).
 */

import ExcelJS from "exceljs"
import { downloadBlob } from "@/lib/utils"
import { resolveAlign, toDate, toNumber, todayLabel } from "./format"
import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_PRIMARY_COLOR,
  type ExportColumn,
  type ExportPayload,
} from "./types"

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

const NUM_FMT_XOF = '#,##0" XOF"'
const NUM_FMT_NUMBER = "#,##0.##"
const NUM_FMT_DATE = "dd/mm/yyyy"

/** Convertit `#RRGGBB` en ARGB ExcelJS (`FFRRGGBB`). */
function toArgb(hex: string): string {
  const clean = hex.replace("#", "").trim()
  return `FF${clean.toUpperCase().padStart(6, "0").slice(0, 6)}`
}

/** Écrit une cellule typée selon le format de la colonne. */
function writeDataCell(
  cell: ExcelJS.Cell,
  value: unknown,
  column: ExportColumn,
): void {
  const format = column.format ?? "text"
  if (format === "number" || format === "xof") {
    const n = toNumber(value)
    if (n !== null) {
      cell.value = n
      cell.numFmt = format === "xof" ? NUM_FMT_XOF : NUM_FMT_NUMBER
    } else {
      cell.value = value == null ? "" : String(value)
    }
  } else if (format === "date") {
    const d = toDate(value)
    if (d !== null) {
      cell.value = d
      cell.numFmt = NUM_FMT_DATE
    } else {
      cell.value = value == null ? "" : String(value)
    }
  } else {
    cell.value = value == null ? "" : String(value)
  }
  cell.alignment = { horizontal: resolveAlign(column), vertical: "middle" }
}

/** Ajoute le bloc d'entête marqué et renvoie le numéro de la 1re ligne libre. */
function writeHeaderBlock(
  ws: ExcelJS.Worksheet,
  payload: ExportPayload,
  primaryArgb: string,
): number {
  const { branding, meta } = payload
  let row = 1

  const school = ws.getCell(row, 1)
  school.value = branding.schoolName
  school.font = { bold: true, size: 14, color: { argb: primaryArgb } }
  row += 1

  const title = ws.getCell(row, 1)
  title.value = meta.title
  title.font = { bold: true, size: 12 }
  row += 1

  if (meta.subtitle) {
    const subtitle = ws.getCell(row, 1)
    subtitle.value = meta.subtitle
    subtitle.font = { italic: true, size: 11, color: { argb: "FF555555" } }
    row += 1
  }

  const contextParts = [
    meta.filters ? `Filtre : ${meta.filters}` : null,
    `Date : ${meta.date ?? todayLabel()}`,
    `${payload.rows.length} ligne${payload.rows.length > 1 ? "s" : ""}`,
  ].filter((part): part is string => part !== null)
  const context = ws.getCell(row, 1)
  context.value = contextParts.join("   ·   ")
  context.font = { size: 10, color: { argb: "FF555555" } }
  row += 2 // ligne vide de séparation

  return row
}

/** Applique le style d'entête de table (gras blanc sur fond primaire). */
function styleHeaderRow(row: ExcelJS.Row, primaryArgb: string): void {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: primaryArgb },
    }
    cell.alignment = { vertical: "middle" }
    cell.border = { bottom: { style: "thin", color: { argb: primaryArgb } } }
  })
}

/**
 * Construit le classeur ExcelJS complet à partir du payload.
 */
export async function buildWorkbook(
  payload: ExportPayload,
): Promise<ExcelJS.Workbook> {
  const { columns, rows, totalsRow, branding } = payload
  const primaryArgb = toArgb(branding.primaryColor || DEFAULT_PRIMARY_COLOR)
  const accentArgb = toArgb(branding.accentColor || DEFAULT_ACCENT_COLOR)

  const wb = new ExcelJS.Workbook()
  wb.creator = branding.schoolName
  wb.created = new Date()
  const ws = wb.addWorksheet(payload.meta.title.slice(0, 31) || "Export")

  const headerRowNumber = writeHeaderBlock(ws, payload, primaryArgb)

  // Largeurs de colonnes
  columns.forEach((col, index) => {
    ws.getColumn(index + 1).width = col.width ?? Math.max(12, col.header.length + 4)
  })

  // Entête de table
  const headerRow = ws.getRow(headerRowNumber)
  columns.forEach((col, index) => {
    headerRow.getCell(index + 1).value = col.header
  })
  styleHeaderRow(headerRow, primaryArgb)

  // Lignes de données
  rows.forEach((data, rowIndex) => {
    const excelRow = ws.getRow(headerRowNumber + 1 + rowIndex)
    columns.forEach((col, colIndex) => {
      writeDataCell(excelRow.getCell(colIndex + 1), data[col.key], col)
    })
  })

  const lastDataRow = headerRowNumber + rows.length

  // Ligne total optionnelle
  if (totalsRow) {
    const totalRow = ws.getRow(lastDataRow + 1)
    columns.forEach((col, colIndex) => {
      const cell = totalRow.getCell(colIndex + 1)
      writeDataCell(cell, totalsRow[col.key], col)
      cell.font = { bold: true }
      cell.border = { top: { style: "medium", color: { argb: accentArgb } } }
    })
  }

  // Autofiltre sur l'entête + données
  ws.autoFilter = {
    from: { row: headerRowNumber, column: 1 },
    to: { row: Math.max(lastDataRow, headerRowNumber), column: columns.length },
  }

  // Volet figé sous l'entête de table
  ws.views = [{ state: "frozen", ySplit: headerRowNumber }]

  return wb
}

/**
 * Génère puis télécharge le classeur Excel.
 */
export async function exportToExcel(
  payload: ExportPayload,
  filename: string,
): Promise<void> {
  const wb = await buildWorkbook(payload)
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: XLSX_MIME })
  downloadBlob(blob, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`)
}
