/**
 * Socle d'export réutilisable : builders Excel + PDF thémés par le tenant
 * et types partagés. Le composant `<ExportMenu>` vit dans
 * `components/export/ExportMenu`.
 */

export * from "./types"
export {
  formatCell,
  formatDate,
  formatNumber,
  formatXof,
  resolveAlign,
  todayLabel,
} from "./format"
export { buildWorkbook, exportToExcel } from "./excel"
export { buildTablePdf, exportToPdf } from "./pdf"
