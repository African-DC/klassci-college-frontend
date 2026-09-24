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
import { withLogo } from "./logo"
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

const LIGNE_MINISTERE = "MINISTÈRE DE L'ÉDUCATION NATIONALE ET DE L'ALPHABÉTISATION"
const LIGNE_REPUBLIQUE = "RÉPUBLIQUE DE CÔTE D'IVOIRE"
const DEVISE_REPUBLIQUE = "Union - Discipline - Travail"

/** Hauteur du logo dans la feuille, en pixels : quatre lignes d'en-tête. */
const LOGO_PX = 72

/**
 * L'en-tête officiel, comme sur les documents PDF de l'établissement :
 * ministère et identité à gauche, République à droite, logo en tête.
 *
 * Aucune fusion de cellules : le texte déborde sur les cellules vides voisines,
 * ce qui garde la zone de données propre au tri, aux filtres et aux tableaux
 * croisés. Le logo est une image posée sur la feuille, pas une cellule.
 */
function writeOfficialHeader(
  wb: ExcelJS.Workbook,
  ws: ExcelJS.Worksheet,
  payload: ExportPayload,
  primaryArgb: string,
): number {
  const { branding, columns } = payload
  const derniere = Math.max(columns.length, 4)
  // Le logo occupe la première colonne ; le texte commence juste après.
  const texte = branding.logoDataUrl ? 2 : 1

  const gauche: [string, Partial<ExcelJS.Font>][] = [
    [LIGNE_MINISTERE, { bold: true, size: 9 }],
    [branding.schoolName.toUpperCase(), { bold: true, size: 13, color: { argb: primaryArgb } }],
  ]
  if (branding.ministryCode) gauche.push([`Code établissement : ${branding.ministryCode}`, { size: 9 }])
  const contact = [branding.address, branding.phone, branding.email].filter(Boolean).join("   ·   ")
  if (contact) gauche.push([contact, { size: 9, color: { argb: "FF555555" } }])
  if (branding.motto) gauche.push([branding.motto, { italic: true, size: 9, color: { argb: "FF555555" } }])

  gauche.forEach(([valeur, police], index) => {
    const cell = ws.getCell(index + 1, texte)
    cell.value = valeur
    cell.font = police
  })

  const republique = ws.getCell(1, derniere)
  republique.value = LIGNE_REPUBLIQUE
  republique.font = { bold: true, size: 9 }
  republique.alignment = { horizontal: "right" }
  const devise = ws.getCell(2, derniere)
  devise.value = DEVISE_REPUBLIQUE
  devise.font = { italic: true, size: 9 }
  devise.alignment = { horizontal: "right" }

  if (branding.logoDataUrl) {
    const image = wb.addImage({ base64: branding.logoDataUrl, extension: "png" })
    ws.addImage(image, { tl: { col: 0.1, row: 0.1 }, ext: { width: LOGO_PX, height: LOGO_PX } })
    // Assez de hauteur sous le logo pour qu'il ne chevauche pas le titre.
    for (let r = 1; r <= Math.max(gauche.length, 4); r += 1) ws.getRow(r).height = 20
  }

  return Math.max(gauche.length, branding.logoDataUrl ? 4 : 2) + 2
}

/** Ajoute le bloc d'entête marqué et renvoie le numéro de la 1re ligne libre. */
function writeHeaderBlock(
  wb: ExcelJS.Workbook,
  ws: ExcelJS.Worksheet,
  payload: ExportPayload,
  primaryArgb: string,
): number {
  const { meta } = payload
  let row = writeOfficialHeader(wb, ws, payload, primaryArgb)

  const title = ws.getCell(row, 1)
  title.value = meta.title
  title.font = { bold: true, size: 13, color: { argb: primaryArgb } }
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

  const headerRowNumber = writeHeaderBlock(wb, ws, payload, primaryArgb)

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
  const wb = await buildWorkbook({ ...payload, branding: await withLogo(payload.branding) })
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: XLSX_MIME })
  downloadBlob(blob, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`)
}
