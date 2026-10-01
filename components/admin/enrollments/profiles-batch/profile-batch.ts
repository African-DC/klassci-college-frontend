import type { InformationSheetRow } from "@/lib/contracts/information-sheet"
import {
  lv2AllowedForLevel,
  profileChanges,
  profileOf,
  type EnrollmentProfile,
  type ProfileBatchItem,
} from "@/lib/contracts/enrollment-profile"

/** Ce que la secrétaire a modifié, ligne par ligne, avant d'enregistrer. */
export type ProfileDrafts = Record<number, EnrollmentProfile>

/** La valeur affichée d'une ligne : son brouillon s'il existe, sinon le serveur. */
export function rowProfile(row: InformationSheetRow, drafts: ProfileDrafts): EnrollmentProfile {
  return drafts[row.enrollment_id] ?? profileOf(row)
}

/**
 * Les lignes à envoyer : seulement celles qui diffèrent du serveur, et dans
 * chacune seulement les champs changés. Une ligne modifiée puis remise à sa
 * valeur d'origine ne part pas.
 */
export function changedItems(
  rows: InformationSheetRow[],
  drafts: ProfileDrafts,
  levelName: string | null,
): ProfileBatchItem[] {
  const lv2Allowed = lv2AllowedForLevel(levelName)
  return rows.flatMap((row) => {
    const draft = drafts[row.enrollment_id]
    if (!draft) return []
    const target = lv2Allowed ? draft : { ...draft, lv2: null }
    const changes = profileChanges(profileOf(row), target)
    return Object.keys(changes).length > 0 ? [{ enrollment_id: row.enrollment_id, ...changes }] : []
  })
}

/** « KONÉ Awa » : le nom tel qu'il figure sur la liste de classe. */
export function rowName(row: InformationSheetRow): string {
  return `${row.last_name} ${row.first_name}`.trim()
}
