"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ARTISTIC_DISCIPLINES,
  LV2_OPTIONS,
  PREVIOUS_LEVELS,
  lv2AllowedForLevel,
  type EnrollmentProfile,
} from "@/lib/contracts/enrollment-profile"
import { OptionSelect, RepeaterChoice } from "./ProfileInputs"
import { QualityHintText, type QualityHint } from "./QualityHintText"

interface EnrollmentProfileFieldsProps {
  value: EnrollmentProfile
  /** `field` nomme le champ touché : les écrans de correction suivent la qualité. */
  onChange: (next: EnrollmentProfile, field: keyof EnrollmentProfile) => void
  /** Niveau de la classe choisie : en 6ème et en 5ème, pas de LV2. */
  levelName?: string | null
  disabled?: boolean
  /** Distinct par écran : deux formulaires ouverts ne partagent pas leurs `id`. */
  idPrefix: string
  /** Réinscription : dire que le serveur reprend l'an dernier si on laisse vide. */
  reEnrollment?: boolean
  /**
   * Ce que le serveur fera de la qualité laissée de côté, pour le dire sous le champ :
   * - `creation` : à la création, une qualité « Non renseigné » est déduite
   *   du niveau antérieur ;
   * - `recompute` : en correction, le niveau antérieur a changé sans que la
   *   qualité soit touchée, le serveur la recalcule ;
   * - `null` : rien à annoncer.
   */
  qualityHint?: QualityHint
  /** Saisie par classe : le nom de l'élève titre le bloc et nomme ses champs. */
  studentName?: string
}

/**
 * Les renseignements que la comptabilité reporte sur la fiche de chaque classe.
 *
 * Tout est facultatif : ce qui reste vide sort vide sur la fiche, et l'école
 * le complète à la main. Rien n'est pré-rempli par supposition.
 */
export function EnrollmentProfileFields({
  value,
  onChange,
  levelName,
  disabled,
  idPrefix,
  reEnrollment,
  qualityHint = null,
  studentName,
}: EnrollmentProfileFieldsProps) {
  const lv2Allowed = lv2AllowedForLevel(levelName)
  const set = <K extends keyof EnrollmentProfile>(key: K, next: EnrollmentProfile[K]) =>
    onChange({ ...value, [key]: next }, key)

  return (
    <fieldset className="space-y-4 rounded-lg border border-border/60 bg-muted/40 p-4">
      <legend className="px-1 text-sm font-semibold">
        {studentName ?? "Renseignements de la fiche"}
      </legend>
      {reEnrollment ? (
        <p className="text-xs text-muted-foreground">
          Laissés vides, le niveau antérieur, la LV2 et la discipline artistique sont repris de
          l&apos;inscription de l&apos;année précédente, s&apos;il y en a une. La qualité est
          alors déduite du niveau antérieur.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-previous-level`}>Niveau antérieur</Label>
          <OptionSelect
            id={`${idPrefix}-previous-level`}
            value={value.previous_level}
            options={PREVIOUS_LEVELS}
            onChange={(v) => set("previous_level", v)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-previous-series`}>Série</Label>
          <Input
            id={`${idPrefix}-previous-series`}
            className="h-11"
            placeholder="Ex : C"
            maxLength={20}
            disabled={disabled}
            value={value.previous_series ?? ""}
            onChange={(e) => set("previous_series", e.target.value.trim() ? e.target.value : null)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-medium">Qualité</p>
        <RepeaterChoice
          label={studentName ? `Qualité de ${studentName}` : "Qualité"}
          value={value.is_repeater}
          onChange={(v) => set("is_repeater", v)}
          disabled={disabled}
        />
        <QualityHintText hint={qualityHint} profile={value} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-lv2`}>LV2</Label>
          <OptionSelect
            id={`${idPrefix}-lv2`}
            value={lv2Allowed ? value.lv2 : null}
            options={LV2_OPTIONS}
            onChange={(v) => set("lv2", v)}
            disabled={disabled || !lv2Allowed}
            emptyLabel={lv2Allowed ? "Non renseigné" : "Non concerné"}
          />
          {!lv2Allowed ? (
            <p className="text-xs text-muted-foreground">
              La LV2 commence en 4ème : rien à saisir en 6ème ni en 5ème.
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-art`}>Discipline artistique</Label>
          <OptionSelect
            id={`${idPrefix}-art`}
            value={value.artistic_discipline}
            options={ARTISTIC_DISCIPLINES}
            onChange={(v) => set("artistic_discipline", v)}
            disabled={disabled}
          />
        </div>
      </div>
    </fieldset>
  )
}
