import { z } from "zod"

// Miroir du contrat BE #469 : les renseignements que la fiche de la
// comptabilité réclame pour chaque élève, et la bourse.
//
// Tous les champs sont nullables : `null` veut dire « pas renseigné », jamais
// « non ». L'école complète à la main ce que personne n'a encore saisi, et un
// défaut deviné (« Non redoublant », « Non boursier ») serait une fausse
// déclaration sur un document remis au ministère.

export const PreviousLevelSchema = z.enum(["CM2", "6E", "5E", "4E", "3E", "2NDE", "1RE", "TLE"])
export const Lv2Schema = z.enum(["allemand", "espagnol"])
export const ArtisticDisciplineSchema = z.enum(["arts_plastiques", "musique"])
export const ScholarshipKindSchema = z.enum(["bourse_entiere", "demi_bourse"])

export type PreviousLevel = z.infer<typeof PreviousLevelSchema>
export type Lv2 = z.infer<typeof Lv2Schema>
export type ArtisticDiscipline = z.infer<typeof ArtisticDisciplineSchema>
export type ScholarshipKind = z.infer<typeof ScholarshipKindSchema>

export const PREVIOUS_LEVELS: { value: PreviousLevel; label: string }[] = [
  { value: "CM2", label: "CM2" },
  { value: "6E", label: "6ème" },
  { value: "5E", label: "5ème" },
  { value: "4E", label: "4ème" },
  { value: "3E", label: "3ème" },
  { value: "2NDE", label: "2nde" },
  { value: "1RE", label: "1ère" },
  { value: "TLE", label: "Terminale" },
]

export const LV2_OPTIONS: { value: Lv2; label: string }[] = [
  { value: "allemand", label: "Allemand" },
  { value: "espagnol", label: "Espagnol" },
]

export const ARTISTIC_DISCIPLINES: { value: ArtisticDiscipline; label: string }[] = [
  { value: "arts_plastiques", label: "Arts plastiques" },
  { value: "musique", label: "Musique" },
]

export const SCHOLARSHIP_KINDS: { value: ScholarshipKind; label: string }[] = [
  { value: "bourse_entiere", label: "Bourse entière" },
  { value: "demi_bourse", label: "Demi-bourse" },
]

/** Le libellé d'une valeur d'énumération, ou `""` quand rien n'est renseigné. */
export function optionLabel<T extends string>(
  options: { value: T; label: string }[],
  value: T | null | undefined,
): string {
  if (!value) return ""
  return options.find((o) => o.value === value)?.label ?? value
}

/** « 2nde C », « 3ème », ou `""` : le niveau antérieur tel qu'on l'écrit. */
export function previousLevelLabel(
  level: PreviousLevel | null | undefined,
  series: string | null | undefined,
): string {
  const label = optionLabel(PREVIOUS_LEVELS, level)
  if (!label) return ""
  const serie = (series ?? "").trim()
  return serie ? `${label} ${serie}` : label
}

/** Qualité : `true` Redoublant, `false` Non redoublant, `null` non renseigné. */
export function repeaterLabel(value: boolean | null | undefined): string {
  if (value === true) return "Redoublant"
  if (value === false) return "Non redoublant"
  return ""
}

/**
 * La LV2 commence en 4ème : en 6ème et en 5ème, le serveur la refuse (422).
 *
 * On lit le nom du niveau tel que l'école l'a saisi (« 6ème », « 6e »,
 * « 5eme », « Sixième »). Un niveau inconnu n'interdit rien : le serveur reste
 * juge, l'écran ne bloque pas sur une supposition.
 */
export function lv2AllowedForLevel(levelName: string | null | undefined): boolean {
  if (!levelName) return true
  const n = levelName
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase()
  return !/^(6|5)(e|eme|em)?\b/.test(n) && !/^(sixieme|cinquieme)/.test(n)
}

export const ScholarshipSchema = z.object({
  kind: ScholarshipKindSchema,
  provider: z.string().nullish(),
  decision_number: z.string().nullish(),
  amount: z.coerce.number().nullish(),
  granted_on: z.string().nullish(),
})

export type Scholarship = z.infer<typeof ScholarshipSchema>

export interface ScholarshipInput {
  kind: ScholarshipKind
  provider?: string | null
  decision_number?: string | null
}

/** Les cinq renseignements d'une inscription, tous à `null` tant qu'ils manquent. */
export interface EnrollmentProfile {
  previous_level: PreviousLevel | null
  previous_series: string | null
  is_repeater: boolean | null
  lv2: Lv2 | null
  artistic_discipline: ArtisticDiscipline | null
}

export type EnrollmentProfileKey = keyof EnrollmentProfile

export const PROFILE_KEYS: EnrollmentProfileKey[] = [
  "previous_level",
  "previous_series",
  "is_repeater",
  "lv2",
  "artistic_discipline",
]

export const EMPTY_PROFILE: EnrollmentProfile = {
  previous_level: null,
  previous_series: null,
  is_repeater: null,
  lv2: null,
  artistic_discipline: null,
}

/** Le profil lu sur une inscription ou une ligne de fiche ; l'absent devient `null`. */
export function profileOf(source: Partial<Record<EnrollmentProfileKey, unknown>>): EnrollmentProfile {
  return {
    previous_level: (source.previous_level as PreviousLevel | null | undefined) ?? null,
    previous_series: (source.previous_series as string | null | undefined) ?? null,
    is_repeater: (source.is_repeater as boolean | null | undefined) ?? null,
    lv2: (source.lv2 as Lv2 | null | undefined) ?? null,
    artistic_discipline:
      (source.artistic_discipline as ArtisticDiscipline | null | undefined) ?? null,
  }
}

/**
 * Seulement ce qui a changé, `null` compris : le serveur lit un `null` envoyé
 * comme « effacer », et une clé absente comme « ne pas toucher ».
 */
export function profileChanges(
  before: EnrollmentProfile,
  after: EnrollmentProfile,
): Partial<EnrollmentProfile> {
  const changes: Partial<EnrollmentProfile> = {}
  for (const key of PROFILE_KEYS) {
    if (before[key] !== after[key]) Object.assign(changes, { [key]: after[key] })
  }
  return changes
}

/**
 * Le serveur recalcule la qualité quand le niveau antérieur change et que la
 * qualité n'est pas envoyée (BE #472). Vrai tant que la secrétaire a changé
 * le niveau antérieur sans toucher à la qualité : l'écran le dit.
 */
export function qualityWillRecompute(
  saved: EnrollmentProfile,
  draft: EnrollmentProfile,
  repeaterTouched: boolean,
): boolean {
  return !repeaterTouched && draft.previous_level !== saved.previous_level
}

/**
 * Ce qu'une correction envoie au serveur.
 *
 * La qualité ne part que si on l'a touchée : envoyée, elle l'emporte sur le
 * recalcul ; absente, le serveur la déduit du nouveau niveau antérieur. Une
 * qualité touchée part même remise à sa valeur d'origine quand le niveau
 * antérieur change : c'est un choix explicite, il ne doit pas être recalculé.
 */
export function profileUpdateChanges(
  saved: EnrollmentProfile,
  draft: EnrollmentProfile,
  repeaterTouched: boolean,
): Partial<EnrollmentProfile> {
  const changes = profileChanges(saved, draft)
  if (!repeaterTouched) {
    delete changes.is_repeater
  } else if ("previous_level" in changes) {
    changes.is_repeater = draft.is_repeater
  }
  return changes
}

export const ProfileBatchResultSchema = z.object({ updated: z.number() })
export type ProfileBatchResult = z.infer<typeof ProfileBatchResultSchema>

export type ProfileBatchItem = { enrollment_id: number } & Partial<EnrollmentProfile>

// Les champs tels qu'ils voyagent sur l'inscription. `nullish` : un serveur
// pas encore à jour les omet, et la réponse entière doit continuer de passer.
export const EnrollmentProfileFieldsSchema = z.object({
  previous_level: PreviousLevelSchema.nullish(),
  previous_series: z.string().max(20).nullish(),
  is_repeater: z.boolean().nullish(),
  lv2: Lv2Schema.nullish(),
  artistic_discipline: ArtisticDisciplineSchema.nullish(),
})
