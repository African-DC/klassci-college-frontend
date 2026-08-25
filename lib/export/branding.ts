/**
 * Construit l'identité visuelle d'export à partir des paramètres du tenant.
 *
 * Centralise le mapping `SchoolSettings` -> `ExportBranding` pour éviter la
 * répétition dans chaque page qui pose un `<ExportMenu>` (élèves, paiements,
 * notes, présences...). Le logo n'est volontairement pas géré ici.
 */

import type { SchoolSettings } from "@/lib/contracts/settings"
import type { ExportBranding } from "./types"
import { DEFAULT_ACCENT_COLOR, DEFAULT_PRIMARY_COLOR } from "./types"

/** Mappe les paramètres de l'établissement vers la marque d'export (fallback KLASSCI). */
export function brandingFromSettings(
  settings: SchoolSettings | undefined,
): ExportBranding {
  return {
    schoolName: settings?.school_name ?? "Établissement",
    primaryColor: settings?.primary_color ?? DEFAULT_PRIMARY_COLOR,
    accentColor: settings?.accent_color ?? DEFAULT_ACCENT_COLOR,
  }
}
