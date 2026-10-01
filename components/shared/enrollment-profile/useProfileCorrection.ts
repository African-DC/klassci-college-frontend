"use client"

import { useState } from "react"
import {
  EMPTY_PROFILE,
  profileUpdateChanges,
  qualityWillRecompute,
  type EnrollmentProfile,
} from "@/lib/contracts/enrollment-profile"
import type { QualityHint } from "./QualityHintText"

/**
 * Corriger les renseignements d'une inscription existante.
 *
 * Suit si la qualité a été touchée : non touchée, elle ne part pas, et le
 * serveur la recalcule quand le niveau antérieur change (BE #472). L'écran
 * l'annonce sous le champ. `saved` vaut `null` tant que l'inscription charge.
 */
export function useProfileCorrection(saved: EnrollmentProfile | null) {
  const [draft, setDraft] = useState<EnrollmentProfile | null>(null)
  const [repeaterTouched, setRepeaterTouched] = useState(false)
  const base = saved ?? EMPTY_PROFILE
  const value = draft ?? base

  return {
    value,
    changes: draft ? profileUpdateChanges(base, draft, repeaterTouched) : {},
    qualityHint: (draft && qualityWillRecompute(base, draft, repeaterTouched)
      ? "recompute"
      : null) as QualityHint,
    onChange: (next: EnrollmentProfile, field: keyof EnrollmentProfile) => {
      if (field === "is_repeater") setRepeaterTouched(true)
      setDraft(next)
    },
    reset: () => {
      setDraft(null)
      setRepeaterTouched(false)
    },
  }
}
