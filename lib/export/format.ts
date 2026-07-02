/**
 * Helpers de formatage partagés par les builders Excel et PDF.
 *
 * Le PDF consomme des chaînes déjà formatées (`formatCell`), tandis que
 * l'Excel conserve les valeurs typées et applique un `numFmt` natif. Les
 * fonctions ci-dessous fournissent aussi les primitives de conversion
 * (nombre, montant, date) réutilisées par les deux.
 */

import type { ExportAlign, ExportColumn, ExportFormat } from "./types"

/** Espace insécable fine (séparateur de milliers, sobre pour l'impression). */
const THIN_NBSP = " "

/** Convertit une valeur inconnue en nombre fini, ou `null` si impossible. */
export function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.replace(/\s/g, "").replace(",", "."))
    return Number.isFinite(n) ? n : null
  }
  return null
}

/** Convertit une valeur inconnue en `Date` valide, ou `null`. */
export function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

/** Formate un nombre avec séparateur de milliers (espace insécable fine). */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 })
    .format(value)
    .replace(/ |\s/g, THIN_NBSP)
}

/** Formate un montant en francs CFA : `1 280 000 XOF`. */
export function formatXof(value: number): string {
  return `${formatNumber(Math.round(value))}${THIN_NBSP}XOF`
}

/** Formate une date au format ivoirien `JJ/MM/AAAA`. */
export function formatDate(value: Date): string {
  const day = String(value.getDate()).padStart(2, "0")
  const month = String(value.getMonth() + 1).padStart(2, "0")
  return `${day}/${month}/${value.getFullYear()}`
}

/**
 * Rend une cellule sous forme de chaîne selon son format logique.
 * Utilisé par le builder PDF (qui n'accepte que du texte).
 */
export function formatCell(value: unknown, format: ExportFormat = "text"): string {
  if (value === null || value === undefined) return ""

  if (format === "number") {
    const n = toNumber(value)
    return n === null ? String(value) : formatNumber(n)
  }
  if (format === "xof") {
    const n = toNumber(value)
    return n === null ? String(value) : formatXof(n)
  }
  if (format === "date") {
    const d = toDate(value)
    return d === null ? String(value) : formatDate(d)
  }
  return String(value)
}

/** Alignement effectif d'une colonne (les valeurs numériques cadrent à droite). */
export function resolveAlign(column: ExportColumn): ExportAlign {
  if (column.align) return column.align
  return column.format === "number" || column.format === "xof" ? "right" : "left"
}

/** Date du jour formatée, utilisée quand `meta.date` est absent. */
export function todayLabel(): string {
  return formatDate(new Date())
}
