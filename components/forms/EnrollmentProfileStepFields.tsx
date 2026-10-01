"use client"

import type { UseFormReturn } from "react-hook-form"
import type { Class } from "@/lib/contracts/class"
import type { NewEnrollment, ReEnrollment } from "@/lib/contracts/enrollment"
import { profileOf, type EnrollmentProfile } from "@/lib/contracts/enrollment-profile"
import { EnrollmentProfileFields } from "@/components/shared/enrollment-profile/EnrollmentProfileFields"

type StepProps =
  | { enrollmentType: "new"; form: UseFormReturn<NewEnrollment>; classes: Class[] }
  | { enrollmentType: "re-enrollment"; form: UseFormReturn<ReEnrollment>; classes: Class[] }

function writeProfile(props: StepProps, p: EnrollmentProfile) {
  // Deux formulaires de types distincts : TypeScript ne sait pas appeler
  // `setValue` sur leur union, d'où les deux branches identiques.
  if (props.enrollmentType === "new") {
    const f = props.form
    f.setValue("previous_level", p.previous_level)
    f.setValue("previous_series", p.previous_series)
    f.setValue("is_repeater", p.is_repeater)
    f.setValue("lv2", p.lv2)
    f.setValue("artistic_discipline", p.artistic_discipline)
    return
  }
  const f = props.form
  f.setValue("previous_level", p.previous_level)
  f.setValue("previous_series", p.previous_series)
  f.setValue("is_repeater", p.is_repeater)
  f.setValue("lv2", p.lv2)
  f.setValue("artistic_discipline", p.artistic_discipline)
}

/**
 * Les renseignements de la fiche, à l'étape « Classe » de l'inscription.
 *
 * Ils vivent à côté de la classe parce que la LV2 en dépend : pas de LV2 en
 * 6ème ni en 5ème.
 */
export function EnrollmentProfileStepFields(props: StepProps) {
  const values = props.form.watch()
  const levelName = props.classes.find((c) => c.id === values.class_id)?.level_name ?? null
  return (
    <EnrollmentProfileFields
      idPrefix={`enrollment-${props.enrollmentType}`}
      value={profileOf(values)}
      onChange={(p) => writeProfile(props, p)}
      levelName={levelName}
      reEnrollment={props.enrollmentType === "re-enrollment"}
      atCreation
    />
  )
}
