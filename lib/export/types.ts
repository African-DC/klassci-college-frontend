/**
 * Types partagés du socle d'export (Excel + PDF).
 *
 * Un export est décrit par un `ExportPayload` = une table de données
 * (colonnes + lignes + ligne total optionnelle) enrichie de l'identité
 * visuelle du tenant (`branding`) et des métadonnées d'entête (`meta`).
 */

/** Alignement d'une colonne dans les documents générés. */
export type ExportAlign = "left" | "right" | "center"

/**
 * Format logique d'une valeur de cellule.
 * - `text`   : chaîne brute
 * - `number` : nombre avec séparateur de milliers
 * - `xof`    : montant en francs CFA (`1 280 000 XOF`)
 * - `date`   : date au format `JJ/MM/AAAA`
 */
export type ExportFormat = "text" | "number" | "xof" | "date"

/** Définition d'une colonne exportable. */
export interface ExportColumn {
  /** Clé de lecture dans chaque ligne (`row[key]`). */
  key: string
  /** Libellé affiché dans l'entête. */
  header: string
  /** Largeur indicative (caractères Excel / mm PDF selon le builder). */
  width?: number
  /** Alignement du contenu (défaut : `left`, ou `right` pour number/xof). */
  align?: ExportAlign
  /** Format logique de la valeur (défaut : `text`). */
  format?: ExportFormat
}

/** Identité visuelle du tenant appliquée aux documents. */
export interface ExportBranding {
  /** Nom de l'établissement (masthead PDF / entête Excel). */
  schoolName: string
  /** Logo en data URL (`data:image/png;base64,...`), optionnel. */
  logoDataUrl?: string
  /** Couleur primaire de la marque (entête de table, filet). */
  primaryColor: string
  /** Couleur d'accent (ligne total, finance). */
  accentColor: string
}

/** Métadonnées d'entête du document. */
export interface ExportMeta {
  /** Titre principal du rapport. */
  title: string
  /** Sous-titre optionnel (contexte, période). */
  subtitle?: string
  /** Description des filtres appliqués (ex : "Classe 6e A, T1"). */
  filters?: string
  /** Date de génération lisible (défaut : date du jour si omise). */
  date?: string
}

/** Table de données à exporter. */
export interface ExportTable {
  /** Colonnes ordonnées. */
  columns: ExportColumn[]
  /** Lignes de données (dictionnaires clé -> valeur). */
  rows: Record<string, unknown>[]
  /** Ligne total optionnelle (mêmes clés que les colonnes). */
  totalsRow?: Record<string, unknown>
  /** Force le format paysage (sinon auto si > 6 colonnes). */
  landscape?: boolean
}

/** Charge utile complète prête à exporter. */
export type ExportPayload = ExportTable & {
  branding: ExportBranding
  meta: ExportMeta
}

/** Couleur primaire de marque par défaut (bleu KLASSCI). */
export const DEFAULT_PRIMARY_COLOR = "#0F3F8C"
/** Couleur d'accent de marque par défaut (orange KLASSCI). */
export const DEFAULT_ACCENT_COLOR = "#F58220"
