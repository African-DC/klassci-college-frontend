/**
 * Builder PDF tabulaire du socle d'export (pdfme v6).
 *
 * Compose un masthead compact (logo optionnel + nom école) + une ligne
 * meta (titre · filtre · nb lignes · date) + un filet couleur primaire,
 * puis un TABLEAU (entête couleur primaire, lignes zébrées, entête
 * répété à chaque page). Paysage automatique si `landscape` ou > 6
 * colonnes. La ligne total est ajoutée en fin de tableau pour la finance.
 *
 * API pdfme v6 confirmée :
 *   generate({ template, inputs, plugins }) => Promise<Uint8Array>
 *   plugins = { text, line, image, table } (imports explicites requis en v6)
 *   contenu dynamique de la table via inputs[0][tableName] = string[][]
 *   colonnes / styles via le schéma `table` du template.
 */

import { generate } from "@pdfme/generator"
import type { Template } from "@pdfme/common"
import { image, line, table, text } from "@pdfme/schemas"
import { downloadBlob } from "@/lib/utils"
import { formatCell, resolveAlign, todayLabel } from "./format"
import {
  DEFAULT_PRIMARY_COLOR,
  type ExportColumn,
  type ExportPayload,
} from "./types"

const PDF_MIME = "application/pdf"

// Dimensions A4 en mm.
const A4_SHORT = 210
const A4_LONG = 297
const MARGIN = 12
const MASTHEAD_TOP = 12
const LOGO_SIZE = 16
const TABLE_START_Y = 38

const ZEBRA_COLOR = "#F4F6FA"
const BODY_TEXT_COLOR = "#1A1A1A"
const BORDER_COLOR = "#E2E8F0"
const META_COLOR = "#555555"

const EVEN_PADDING = { top: 3, right: 3, bottom: 3, left: 3 }
const NO_BORDER = { top: 0, right: 0, bottom: 0, left: 0 }
const THIN_BORDER = { top: 0.1, right: 0.1, bottom: 0.1, left: 0.1 }

/** Répartit les largeurs de colonnes en pourcentages (somme = 100). */
function computeWidthPercentages(columns: ExportColumn[]): number[] {
  const weights = columns.map((c) => c.width ?? c.header.length + 4)
  const total = weights.reduce((sum, w) => sum + w, 0) || columns.length
  return weights.map((w) => Number(((w / total) * 100).toFixed(4)))
}

/** Construit la ligne meta : titre · filtre · nb lignes · date. */
function buildMetaLine(payload: ExportPayload): string {
  const { meta, rows } = payload
  const parts = [
    meta.title,
    meta.subtitle,
    meta.filters ? `Filtre : ${meta.filters}` : undefined,
    `${rows.length} ligne${rows.length > 1 ? "s" : ""}`,
    meta.date ?? todayLabel(),
  ].filter((part): part is string => Boolean(part))
  return parts.join("   ·   ")
}

/** Transforme les lignes en matrice de chaînes formatées pour la table. */
function buildTableBody(payload: ExportPayload): string[][] {
  const { columns, rows, totalsRow } = payload
  const body = rows.map((row) =>
    columns.map((col) => formatCell(row[col.key], col.format)),
  )
  if (totalsRow) {
    body.push(
      columns.map((col, index) => {
        const raw = formatCell(totalsRow[col.key], col.format)
        if (index === 0 && !raw) return "TOTAL"
        return raw
      }),
    )
  }
  return body
}

/** Assemble le template pdfme (masthead + meta + filet + table). */
function buildTemplate(payload: ExportPayload, landscape: boolean): Template {
  const { columns } = payload
  const primary = payload.branding.primaryColor || DEFAULT_PRIMARY_COLOR

  const pageWidth = landscape ? A4_LONG : A4_SHORT
  const pageHeight = landscape ? A4_SHORT : A4_LONG
  const contentWidth = pageWidth - MARGIN * 2
  const hasLogo = Boolean(payload.branding.logoDataUrl)
  const textLeft = hasLogo ? MARGIN + LOGO_SIZE + 4 : MARGIN

  const columnAlignment: Record<number, "left" | "center" | "right"> = {}
  columns.forEach((col, index) => {
    columnAlignment[index] = resolveAlign(col)
  })

  const cellBase = {
    verticalAlignment: "middle" as const,
    lineHeight: 1,
    characterSpacing: 0,
  }

  const schemas: Record<string, unknown>[] = []

  if (hasLogo) {
    schemas.push({
      name: "logo",
      type: "image",
      position: { x: MARGIN, y: MASTHEAD_TOP },
      width: LOGO_SIZE,
      height: LOGO_SIZE,
    })
  }

  schemas.push(
    {
      name: "school",
      type: "text",
      position: { x: textLeft, y: MASTHEAD_TOP + 1 },
      width: contentWidth - (textLeft - MARGIN),
      height: 9,
      fontSize: 14,
      fontColor: primary,
      alignment: "left",
      verticalAlignment: "middle",
      lineHeight: 1,
      characterSpacing: 0,
      backgroundColor: "",
    },
    {
      name: "meta",
      type: "text",
      position: { x: textLeft, y: MASTHEAD_TOP + 11 },
      width: contentWidth - (textLeft - MARGIN),
      height: 12,
      fontSize: 8.5,
      fontColor: META_COLOR,
      alignment: "left",
      verticalAlignment: "top",
      lineHeight: 1.2,
      characterSpacing: 0,
      backgroundColor: "",
    },
    {
      name: "filet",
      type: "line",
      position: { x: MARGIN, y: TABLE_START_Y - 4 },
      width: contentWidth,
      height: 0.6,
      color: primary,
    },
    {
      name: "table",
      type: "table",
      position: { x: MARGIN, y: TABLE_START_Y },
      width: contentWidth,
      height: 40,
      showHead: true,
      repeatHead: true,
      head: columns.map((col) => col.header),
      headWidthPercentages: computeWidthPercentages(columns),
      tableStyles: { borderColor: BORDER_COLOR, borderWidth: 0.1 },
      headStyles: {
        ...cellBase,
        fontSize: 9,
        alignment: "left",
        fontColor: "#FFFFFF",
        backgroundColor: primary,
        borderColor: "",
        borderWidth: NO_BORDER,
        padding: EVEN_PADDING,
      },
      bodyStyles: {
        ...cellBase,
        fontSize: 8.5,
        alignment: "left",
        fontColor: BODY_TEXT_COLOR,
        backgroundColor: "",
        alternateBackgroundColor: ZEBRA_COLOR,
        borderColor: BORDER_COLOR,
        borderWidth: THIN_BORDER,
        padding: EVEN_PADDING,
      },
      columnStyles: { alignment: columnAlignment },
    },
  )

  return {
    basePdf: {
      width: pageWidth,
      height: pageHeight,
      padding: [MARGIN, MARGIN, MARGIN + 4, MARGIN],
    },
    schemas: [schemas],
  } as unknown as Template
}

/**
 * Génère le PDF tabulaire et renvoie un Blob `application/pdf`.
 */
export async function buildTablePdf(payload: ExportPayload): Promise<Blob> {
  const landscape = payload.landscape ?? payload.columns.length > 6
  const template = buildTemplate(payload, landscape)

  const input: Record<string, unknown> = {
    school: payload.branding.schoolName,
    meta: buildMetaLine(payload),
    table: buildTableBody(payload),
  }
  if (payload.branding.logoDataUrl) {
    input.logo = payload.branding.logoDataUrl
  }

  const pdf = await generate({
    template,
    inputs: [input],
    plugins: { text, line, image, table },
  })

  return new Blob([new Uint8Array(pdf)], { type: PDF_MIME })
}

/**
 * Génère puis télécharge le PDF tabulaire.
 */
export async function exportToPdf(
  payload: ExportPayload,
  filename: string,
): Promise<void> {
  const blob = await buildTablePdf(payload)
  downloadBlob(blob, filename.endsWith(".pdf") ? filename : `${filename}.pdf`)
}
