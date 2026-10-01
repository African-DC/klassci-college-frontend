import type { InformationSheetRow } from "@/lib/contracts/information-sheet"
import type { QualityHint } from "@/components/shared/enrollment-profile/QualityHintText"
import {
  profileOf,
  profileUpdateChanges,
  qualityWillRecompute,
  type EnrollmentProfile,
  type ProfileBatchItem,
} from "@/lib/contracts/enrollment-profile"

/** Une ligne en cours de saisie, et si sa qualité a été touchée à la main. */
export interface RowDraft {
  profile: EnrollmentProfile
  repeaterTouched: boolean
}

/** Ce que la secrétaire a modifié, ligne par ligne, avant d'enregistrer. */
export type ProfileDrafts = Record<number, RowDraft>

/** La valeur affichée d'une ligne : son brouillon s'il existe, sinon le serveur. */
export function rowProfile(row: InformationSheetRow, drafts: ProfileDrafts): EnrollmentProfile {
  return drafts[row.enrollment_id]?.profile ?? profileOf(row)
}

/** Enregistre la saisie d'un champ, et retient qu'on a touché la qualité. */
export function withRowChange(
  drafts: ProfileDrafts,
  row: InformationSheetRow,
  next: EnrollmentProfile,
  field: keyof EnrollmentProfile,
): ProfileDrafts {
  const previous = drafts[row.enrollment_id]
  const repeaterTouched = (previous?.repeaterTouched ?? false) || field === "is_repeater"
  return { ...drafts, [row.enrollment_id]: { profile: next, repeaterTouched } }
}

/**
 * Ce qu'une ligne enverrait. La qualité non touchée ne part pas : le serveur
 * la recalcule alors du nouveau niveau antérieur (BE #472).
 */
export function rowChanges(row: InformationSheetRow, drafts: ProfileDrafts): Partial<EnrollmentProfile> {
  const draft = drafts[row.enrollment_id]
  if (!draft) return {}
  return profileUpdateChanges(profileOf(row), draft.profile, draft.repeaterTouched)
}

/** « recompute » quand le niveau antérieur a changé sans que la qualité soit touchée. */
export function rowQualityHint(row: InformationSheetRow, drafts: ProfileDrafts): QualityHint {
  const draft = drafts[row.enrollment_id]
  if (!draft) return null
  return qualityWillRecompute(profileOf(row), draft.profile, draft.repeaterTouched) ? "recompute" : null
}

/**
 * Les lignes à envoyer : seulement celles qui diffèrent du serveur, et dans
 * chacune seulement les champs changés. Une ligne modifiée puis remise à sa
 * valeur d'origine ne part pas. Pas de nettoyage de la LV2 : en 6ème et 5ème
 * le champ est fermé, et le serveur retire une LV2 qui n'a plus lieu d'être.
 */
export function changedItems(rows: InformationSheetRow[], drafts: ProfileDrafts): ProfileBatchItem[] {
  return rows.flatMap((row) => {
    const changes = rowChanges(row, drafts)
    return Object.keys(changes).length > 0 ? [{ enrollment_id: row.enrollment_id, ...changes }] : []
  })
}

/** « KONÉ Awa » : le nom tel qu'il figure sur la liste de classe. */
export function rowName(row: InformationSheetRow): string {
  return `${row.last_name} ${row.first_name}`.trim()
}
