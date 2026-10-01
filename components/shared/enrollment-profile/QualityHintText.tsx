import type { EnrollmentProfile } from "@/lib/contracts/enrollment-profile"

/** Voir `qualityHint` sur `EnrollmentProfileFields`. */
export type QualityHint = "creation" | "recompute" | null

export const RECOMPUTE_HINT =
  "La qualité sera recalculée à partir du nouveau niveau antérieur : Redoublant s'il est celui de la classe."

/**
 * La phrase sous « Qualité » qui dit ce que le serveur fera d'elle.
 *
 * Sans elle, la secrétaire qui change le niveau antérieur et retrouve une
 * qualité différente à l'enregistrement croit à une erreur de saisie.
 */
export function QualityHintText({
  hint,
  profile,
  compact,
}: {
  hint: QualityHint
  profile: EnrollmentProfile
  compact?: boolean
}) {
  const text =
    hint === "recompute"
      ? RECOMPUTE_HINT
      : hint === "creation" && profile.previous_level && profile.is_repeater === null
        ? "Laissée sur « Non renseigné », la qualité sera déduite du niveau antérieur : Redoublant s'il est celui de la classe, Non redoublant sinon."
        : null
  if (!text) return null
  const className = compact ? "mt-1 text-xs leading-snug" : "text-xs"
  return <p className={`${className} text-muted-foreground`}>{text}</p>
}
